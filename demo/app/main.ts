// Demo application entry point
// This demonstrates how to use the Performer framework
// Note: We only use Performer's public API, not direct dependencies on effect/xstate/etc.

import { userOnboardingProcess, completeUserOnboardingSagaProcess, initializePerformer } from 'peformer';

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
  const demoType = urlParams.get('demo') || 'process';

  if (demoType === 'saga') {
    // Demo: Complete User Onboarding Saga
    console.log('🎭 Running Saga Demo: Complete User Onboarding');

    const sagaOrchestrator = completeUserOnboardingSagaProcess.bootstrap(container);

    console.log('✅ Saga initialized successfully');
    console.log('🎭 Saga orchestrator:', sagaOrchestrator);

    // Show BPMN representation
    const bpmnData = completeUserOnboardingSagaProcess.toBpmnJson();
    console.log('📊 Saga BPMN representation:', bpmnData);

  } else {
    // Demo: Single Process (default)
    console.log('🔄 Running Process Demo: User Onboarding');

    const actor = userOnboardingProcess.bootstrap(container);

    console.log('✅ Process initialized successfully');
    console.log('🎭 Process actor:', actor);

    // Show BPMN representation
    const bpmnData = userOnboardingProcess.toBpmnJson();
    console.log('📊 Process BPMN representation:', bpmnData);

    // Log state changes for debugging
    actor.subscribe((state) => {
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
    padding: 10px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    font-family: monospace;
    font-size: 12px;
  `;

  const currentDemo = new URLSearchParams(window.location.search).get('demo') || 'process';

  switcher.innerHTML = `
    <strong>Demo Switcher:</strong><br>
    <a href="?demo=process" style="color: ${currentDemo === 'process' ? '#2196f3' : '#666'}">🔄 Single Process</a> |
    <a href="?demo=saga" style="color: ${currentDemo === 'saga' ? '#2196f3' : '#666'}">🎭 Saga Orchestration</a>
  `;

  document.body.appendChild(switcher);
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}