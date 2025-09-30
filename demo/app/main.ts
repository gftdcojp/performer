// Demo application entry point
// This demonstrates how to use the Performer framework
// Note: We only use Performer's public API, not direct dependencies on effect/xstate/etc.

import { userOnboardingProcess, initializePerformer } from 'peformer';

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

  // Bootstrap the user onboarding process using Performer's public API
  const actor = userOnboardingProcess.bootstrap(container);

  console.log('✅ App initialized successfully');
  console.log('🎭 Process actor:', actor);

  // Show BPMN representation (this demonstrates the process can be mapped to BPMN)
  const bpmnData = userOnboardingProcess.toBpmnJson();
  console.log('📊 BPMN representation:', bpmnData);

  // Optional: Log state changes for debugging
  actor.subscribe((state) => {
    console.log('🔄 Process state changed:', state.value, state.context);
  });
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}