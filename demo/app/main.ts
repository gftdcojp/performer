// Demo application entry point
// This demonstrates how to use the Performer framework
// Note: We only use Performer's public API, not direct dependencies on effect/xstate/etc.

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

  // Check URL parameters to decide which demo to show
  const urlParams = new URLSearchParams(window.location.search);
  const processId = urlParams.get('process') || 'user-onboarding';

  // Use Process Registry to dynamically load process
  const processInstance = ProcessRegistry.get(processId);

  if (!processInstance) {
    console.error(`❌ Process '${processId}' not found`);
    container.innerHTML = `
      <div style="color: red; padding: 20px;">
        <h2>Process Not Found</h2>
        <p>Available processes:</p>
        <ul>
          ${ProcessRegistry.list().map(p =>
            `<li><a href="?process=${p.metadata.id}">${p.metadata.name} (${p.metadata.type})</a></li>`
          ).join('')}
        </ul>
      </div>
    `;
    return;
  }

  // Initialize the selected process
  const { metadata } = processInstance;
  console.log(`🎯 Running ${metadata.type.toUpperCase()} Demo: ${metadata.name}`);
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

  // Add demo switcher
  addDemoSwitcher(container);
}

function addDemoSwitcher(container: HTMLElement) {
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
    max-width: 300px;
    z-index: 1000;
  `;

  const currentProcess = new URLSearchParams(window.location.search).get('process') || 'user-onboarding';
  const allProcesses = ProcessRegistry.list();

  switcher.innerHTML = `
    <div style="margin-bottom: 10px;"><strong>🎭 Process Selector:</strong></div>
    ${allProcesses.map(p => `
      <div style="margin: 5px 0;">
        <a href="?process=${p.metadata.id}"
           style="color: ${currentProcess === p.metadata.id ? '#2196f3' : '#666'};
                  text-decoration: none;
                  font-weight: ${currentProcess === p.metadata.id ? 'bold' : 'normal'};">
          ${p.metadata.type === 'saga' ? '🎭' : '🔄'} ${p.metadata.name}
        </a>
        <div style="font-size: 12px; color: #888; margin-left: 20px;">
          ${p.metadata.description}
        </div>
      </div>
    `).join('')}
    <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
      Total: ${allProcesses.length} processes
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