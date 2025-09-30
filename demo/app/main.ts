// Demo application entry point
// This demonstrates how to use the Performer framework
// Note: We only use Performer's public API, not direct dependencies on effect/effect-actor/etc.

import {
  userOnboardingProcess,
  completeUserOnboardingSagaProcess,
  initializePerformer,
  ProcessRegistry,
  type ProcessInstance
} from 'peformer';

// Application initialization
async function initApp() {
  console.log('🚀 Initializing Performer Demo App...');

  // Initialize the Performer framework
  const performer = initializePerformer();
  console.log(`📦 Using Performer v${performer.version}`);

  // Get the container element
  const container = document.getElementById('process-container');
  if (!container) {
    console.error('Container element not found!');
    return;
  }

  // Check URL parameters for process name and hash
  const urlParams = new URLSearchParams(window.location.search);
  const processName = urlParams.get('process') || 'user-onboarding';
  const processHash = urlParams.get('hash'); // Optional hash for verification

  console.log(`🔍 Loading process: ${processName}${processHash ? ` (hash: ${processHash})` : ''}`);

  // Use dynamic process loading by name and hash
  let processInstance = ProcessRegistry.getByNameAndHash(processName, processHash);

  if (!processInstance) {
    console.log('📦 Process not in cache, loading dynamically...');
    try {
      processInstance = await ProcessRegistry.loadByNameAndHash(processName, processHash);
    } catch (error) {
      console.error('Failed to load process:', error);
    }
  }

  if (!processInstance) {
    console.error(`❌ Process '${processName}' not found or failed to load`);
    container.innerHTML = `
      <div style="color: red; padding: 20px;">
        <h2>Process Not Found</h2>
        <p>Failed to load process: <strong>${processName}</strong></p>
        ${processHash ? `<p>Expected hash: <code>${processHash}</code></p>` : ''}
        <p>Available processes:</p>
        <ul>
          ${ProcessRegistry.list().map(p =>
            `<li>
              <a href="?process=${p.metadata.id}&hash=${p.metadata.hash}">
                ${p.metadata.name} (${p.metadata.type}) - ${p.metadata.hash}
              </a>
            </li>`
          ).join('')}
        </ul>
        <p><small>💡 You can specify process with hash: <code>?process=name&hash=hash</code></small></p>
      </div>
    `;
    return;
  }

  // Initialize the selected process
  const { metadata } = processInstance;
  console.log(`🎯 Running ${metadata.type.toUpperCase()} Demo: ${metadata.name} (v${metadata.version})`);
  console.log(`🔒 Process hash: ${metadata.hash}`);
  console.log(`📝 ${metadata.description}`);

  const instance = processInstance.bootstrap(container);

  console.log('✅ Process initialized successfully');
  console.log('🎭 Process instance:', instance);

  // Show BPMN representation
  const bpmnData = processInstance.toBpmnJson();
  console.log('📊 BPMN representation:', bpmnData);

  // Show metadata
  console.log('📋 Process metadata:', metadata);

  // Log state changes for debugging (if actor has subscribe method)
  if (instance && typeof instance.subscribe === 'function') {
    instance.subscribe((state: any) => {
      console.log('🔄 Process state changed:', state.value, state.context);
    });
  }

  // Add demo switcher with hash support
  addDemoSwitcher(container, processName, processHash);
}

function addDemoSwitcher(container: HTMLElement, currentProcessName?: string, currentHash?: string) {
  const switcher = document.createElement('div');
  switcher.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: white;
    padding: 15px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    max-width: 320px;
    z-index: 1000;
  `;

  const urlParams = new URLSearchParams(window.location.search);
  const currentProcess = currentProcessName || urlParams.get('process') || 'user-onboarding';
  const currentProcessHash = currentHash || urlParams.get('hash');

  // Get all available processes (both cached and potentially loadable)
  const cachedProcesses = ProcessRegistry.list();

  switcher.innerHTML = `
    <div style="margin-bottom: 10px;"><strong>🎭 Process Selector:</strong></div>
    ${cachedProcesses.map(p => {
      const isCurrent = currentProcess === p.metadata.id &&
                       (!currentProcessHash || currentProcessHash === p.metadata.hash);
      return `
        <div style="margin: 5px 0;">
          <a href="?process=${p.metadata.id}&hash=${p.metadata.hash}"
             style="color: ${isCurrent ? '#2196f3' : '#666'};
                    text-decoration: none;
                    font-weight: ${isCurrent ? 'bold' : 'normal'};">
            ${p.metadata.type === 'saga' ? '🎭' : '🔄'} ${p.metadata.name}
          </a>
          <div style="font-size: 11px; color: #888; margin-left: 20px; font-family: monospace;">
            hash: ${p.metadata.hash}
          </div>
          <div style="font-size: 12px; color: #666; margin-left: 20px;">
            ${p.metadata.description}
          </div>
        </div>
      `;
    }).join('')}
    <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
      <div>Total: ${cachedProcesses.length} processes loaded</div>
      <div style="margin-top: 5px;">
        <strong>💡 Hash Support:</strong><br>
        <code>?process=name&hash=hash</code>
      </div>
    </div>
  `;

  document.body.appendChild(switcher);
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}