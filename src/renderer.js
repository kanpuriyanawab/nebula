// src/renderer.js
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References (always at the top) ---
    const tabBar = document.getElementById('tabBar');
    const newTabButton = document.getElementById('newTabButton');
    const addressBar = document.getElementById('addressBar');
    const goBtn = document.getElementById('goBtn');
    const agentPromptBtn = document.getElementById('agentPromptBtn');
    const backBtn = document.getElementById('backBtn');
    const forwardBtn = document.getElementById('forwardBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    const webviewContainer = document.getElementById('webviewContainer');
    const statusDiv = document.getElementById('status');

    // --- Global/State Variables (always at the top) ---
    let activeTabId = null;
    const tabs = new Map(); // Map: tabId -> { tabElement: HTMLElement, webviewElement: HTMLWebViewElement }
    let nextTabId = 1;
    let currentOmnibarMode = 'url'; // 'url', 'search', 'agent'

    // --- Helper Functions (Declare all of them before they are called) ---

    const updateOmnibarUI = (mode) => {
        currentOmnibarMode = mode;
        if (mode === 'search') {
            addressBar.placeholder = 'Search Google...';
            goBtn.textContent = 'Search';
        } else if (mode === 'agent') {
            addressBar.placeholder = 'Ask the agent... (e.g., create tic tac toe app)';
            goBtn.textContent = 'Ask Agent';
        } else { // 'url' mode
            addressBar.placeholder = 'Type URL or agent/search command...';
            goBtn.textContent = 'Go';
        }
        agentPromptBtn.style.display = (mode === 'agent' ? 'none' : 'inline-block');
    };

    const updateNavigationButtons = (webview) => {
        if (webview && typeof webview.canGoBack === 'function' && typeof webview.canGoForward === 'function' && typeof webview.reload === 'function') {
            backBtn.disabled = !webview.canGoBack();
            forwardBtn.disabled = !webview.canGoForward();
            refreshBtn.disabled = false;
        } else {
            backBtn.disabled = true;
            forwardBtn.disabled = true;
            refreshBtn.disabled = true;
        }
    };

    const handleAgentCommand = async (command) => {
        statusDiv.textContent = `Asking agent: "${command}"...`;
        agentPromptBtn.disabled = true;
        goBtn.disabled = true;

        try {
            const result = await window.electronAPI.generateApp(command);

            if (result.success) {
                // Create a new tab and load the generated HTML as a data URL
                const { tabId, webviewElement } = createNewTab('about:blank', true); // Create a blank tab first

                // Wait for the webview to be ready before loading the data URL
                // This 'dom-ready' listener ensures webview methods are callable.
                webviewElement.addEventListener('dom-ready', () => {
                    const encodedHtml = encodeURIComponent(result.html);
                    const dataUrl = `data:text/html;charset=utf-8,${encodedHtml}`;
                    webviewElement.loadURL(dataUrl);
                    statusDiv.textContent = 'Agent generated app in new tab!';
                    console.log(`Generated app loaded into new tab ${tabId}.`);
                }, { once: true });
            } else {
                statusDiv.textContent = `Agent error: ${result.error || 'Unknown error'}`;
                console.error("Agent generation error:", result.error);
            }
        } catch (error) {
            statusDiv.textContent = `Communication error with agent: ${error.message}`;
            console.error("Agent communication error:", error);
        } finally {
            agentPromptBtn.disabled = false;
            goBtn.disabled = false;
        }
    };

    const navigateTo = (url) => {
        console.log(`Attempting to navigate to: ${url}`);
        if (!url) return;

        let targetUrl = url;
        // Simple URL validation/prefixing (very basic)
        if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('file://') && !url.startsWith('data:')) {
            if (url.startsWith('agent:')) { // This case should now be handled by executeOmnibarCommand
                // However, keep this for defensive programming or if navigateTo is called directly
                const agentCommand = url.substring(6);
                handleAgentCommand(agentCommand);
                return;
            }
            targetUrl = `https://${url}`;
        }

        if (activeTabId !== null) {
            const activeWebview = tabs.get(activeTabId).webviewElement;
            console.log(`Loading URL ${targetUrl} in active webview ${activeTabId}`);
            activeWebview.loadURL(targetUrl); // loadURL is safe here after initial src set
        } else {
            console.log(`No active tab, creating new tab for URL: ${targetUrl}`);
            createNewTab(targetUrl);
        }
    };

    const executeOmnibarCommand = async (command) => {
        if (!command) return;

        // Determine action based on current mode or explicit prefix
        if (currentOmnibarMode === 'search') {
            const query = command.substring('/search '.length).trim();
            if (query) {
                navigateTo(`https://www.google.com/search?q=${encodeURIComponent(query)}`);
            } else {
                navigateTo('https://www.google.com'); // Go to Google search if no query
            }
        } else if (currentOmnibarMode === 'agent') {
            const agentCommand = command.substring('/agent '.length).trim();
            if (agentCommand) {
                handleAgentCommand(agentCommand); // Call the agent handler
            } else {
                statusDiv.textContent = "Please provide a command for the agent (e.g., /agent create tic tac toe app)";
            }
        } else { // 'url' mode - this is the block to change
            // Check if it's a plausible URL (very basic check)
            // If it contains a space, or doesn't have a dot after the first http/s or file, assume it's a search.
            if (command.includes(' ') || !command.includes('.') || (!command.startsWith('http://') && !command.startsWith('https://') && !command.startsWith('file://') && !command.startsWith('data:'))) {
                // It looks like a search query
                navigateTo(`https://www.google.com/search?q=${encodeURIComponent(command)}`);
                updateOmnibarUI('search'); // Optionally, switch UI to search mode
            } else {
                // It looks like a URL
                navigateTo(command);
            }
        }
    };

    const activateTab = (tabId) => {
        console.log(`Activating tab: ${tabId}`);
        if (activeTabId === tabId) return;

        // Deactivate current tab
        if (activeTabId !== null) {
            const prevTab = tabs.get(activeTabId);
            if (prevTab) {
                prevTab.tabElement.classList.remove('active');
                prevTab.webviewElement.classList.remove('active');
                console.log(`Deactivated previous tab: ${activeTabId}`);
            }
        }

        // Activate new tab
        const newTab = tabs.get(tabId);
        if (newTab) {
            newTab.tabElement.classList.add('active');
            newTab.webviewElement.classList.add('active');
            activeTabId = tabId;

            // --- IMPORTANT CHANGE HERE ---
            // When activating a tab, we primarily change its visibility.
            // The address bar and navigation button states should be updated
            // reliably by the webview's 'dom-ready'/'did-finish-load' events
            // whenever the content changes or *becomes* active.
            // For already loaded tabs, manually trigger an update if necessary.
            // Avoid calling webview methods directly here during initial activation
            // to prevent the "not attached to DOM" error.

            // Set placeholder for a moment until webview reports its actual URL
            addressBar.value = 'Loading...';
            updateNavigationButtons(null); // Disable buttons until active webview is fully ready
            updateOmnibarUI('url'); // Reset omnibar mode when activating a tab

            // If the webview is already loaded, ensure its URL/title/nav state is reflected
            // This is safer to do after a very short delay or by re-triggering its load events.
            // For now, relying solely on 'dom-ready' and 'did-finish-load' from the webview itself.

            console.log(`Activated new tab: ${tabId}`);
        } else {
            activeTabId = null;
            addressBar.value = '';
            updateNavigationButtons(null);
            updateOmnibarUI('url');
            console.log(`Could not find tab ${tabId} to activate.`);
        }
    };


    const createNewTab = (url = 'about:blank', isGeneratedApp = false) => {
        const tabId = `tab-${nextTabId++}`;
        console.log(`Creating new tab: ${tabId} for URL: ${url}`);

        const tabElement = document.createElement('div');
        tabElement.classList.add('tab');
        tabElement.dataset.tabId = tabId;
        tabElement.innerHTML = `<span>${isGeneratedApp ? 'Generated App' : 'New Tab'}</span> <span class="tab-close">&times;</span>`;
        tabBar.insertBefore(tabElement, newTabButton);
        console.log(`Tab element created: ${tabElement.outerHTML}`);

        const webviewElement = document.createElement('webview');
        webviewElement.setAttribute('webpreferences', 'nativeWindowOpen=true, nodeIntegration=false, contextIsolation=true, sandbox=true');
        webviewElement.src = url; // Set initial src
        webviewContainer.appendChild(webviewElement);
        console.log(`Webview element created and appended for ${tabId}: src=${webviewElement.src}`);

        tabs.set(tabId, { tabElement, webviewElement });

        // --- Webview Event Listeners ---
        // These listeners are now the SOLE source of truth for updating address bar,
        // tab title, and navigation buttons, ensuring webview is ready.
        webviewElement.addEventListener('dom-ready', () => {
            console.log(`Webview ${tabId} DOM is ready. Updating UI.`);
            if (tabId === activeTabId) { // Only update if this is the currently active tab
                addressBar.value = webviewElement.getURL();
                updateNavigationButtons(webviewElement);
            }
            tabElement.querySelector('span:first-child').textContent = webviewElement.getTitle() || (webviewElement.getURL().split('/')[2] || 'Loading...');
        });

        webviewElement.addEventListener('did-finish-load', () => {
            const currentUrl = webviewElement.getURL();
            const currentTitle = webviewElement.getTitle();
            console.log(`Webview ${tabId} finished loading: ${currentUrl}. Updating UI.`);
            if (tabId === activeTabId) { // Only update if this is the currently active tab
                addressBar.value = currentUrl;
                updateNavigationButtons(webviewElement);
            }
            tabElement.querySelector('span:first-child').textContent = currentTitle || (currentUrl.split('/')[2] || 'Loading...');
        });

        webviewElement.addEventListener('did-navigate', (event) => {
            console.log(`Webview ${tabId} navigated to: ${event.url}. Updating UI.`);
            if (tabId === activeTabId) { // Only update if this is the currently active tab
                addressBar.value = event.url;
                updateNavigationButtons(webviewElement);
            }
            tabElement.querySelector('span:first-child').textContent = webviewElement.getTitle() || (event.url.split('/')[2] || 'Loading...');
        });
        // ... (rest of webview event listeners like click, close) ...

        tabElement.addEventListener('click', (e) => {
            if (!e.target.classList.contains('tab-close')) {
                activateTab(tabId);
            }
        });

        tabElement.querySelector('.tab-close').addEventListener('click', (e) => {
            e.stopPropagation();
            closeTab(tabId);
        });

        activateTab(tabId); // Activate the newly created tab immediately
        return { tabId, webviewElement };
    };


    const closeTab = (tabId) => {
        console.log(`Closing tab: ${tabId}`);
        const tabInfo = tabs.get(tabId);
        if (tabInfo) {
            tabInfo.tabElement.remove();
            tabInfo.webviewElement.remove();
            tabs.delete(tabId);
            console.log(`Tab ${tabId} removed from DOM and map.`);

            if (activeTabId === tabId) {
                const remainingTabIds = Array.from(tabs.keys());
                if (remainingTabIds.length > 0) {
                    activateTab(remainingTabIds[0]);
                } else {
                    console.log("No tabs left, creating a new blank tab.");
                    createNewTab('about:blank');
                }
            }
        }
    };


    // --- Event Listeners (after all functions are declared) ---

    // Listen for input changes in the address bar
    addressBar.addEventListener('input', () => {
        const value = addressBar.value.trim();
        if (value.startsWith('/search')) {
            updateOmnibarUI('search');
        } else if (value.startsWith('/agent')) {
            updateOmnibarUI('agent');
        } else {
            updateOmnibarUI('url');
        }
    });

    addressBar.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            executeOmnibarCommand(addressBar.value);
        }
    });

    goBtn.addEventListener('click', () => executeOmnibarCommand(addressBar.value));

    backBtn.addEventListener('click', () => {
        if (activeTabId !== null) tabs.get(activeTabId).webviewElement.goBack();
    });
    forwardBtn.addEventListener('click', () => {
        if (activeTabId !== null) tabs.get(activeTabId).webviewElement.goForward();
    });
    refreshBtn.addEventListener('click', () => {
        if (activeTabId !== null) tabs.get(activeTabId).webviewElement.reload();
    });

    agentPromptBtn.addEventListener('click', () => {
        updateOmnibarUI('agent'); // Force agent mode
        executeOmnibarCommand(addressBar.value);
    });

    newTabButton.addEventListener('click', async () => {
        console.log("!!! 'New Tab' button click detected!");
        createNewTab('about:blank');
    });

    // --- Initial Setup (always at the very end) ---
    console.log("Initializing first tab...");
    updateOmnibarUI('url'); // Set initial UI state
    createNewTab('https://www.google.com'); // Create the first tab on launch
});