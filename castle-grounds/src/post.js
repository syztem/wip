import * as THREE from 'three/webgpu';
import { pass } from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';

/** Bloom is opt-in (`?bloom=1`) and WebGPU-only. Pipeline-as-only-path paints black on WebGL. */
export function createPost(renderer, scene, camera, { bloomEnabled = false } = {}) {
  const fallback = {
    enabled: false,
    bloomPass: null,
    render() {
      renderer.render(scene, camera);
    },
  };
  if (!bloomEnabled) return fallback;
  try {
    const renderPipeline = new THREE.RenderPipeline(renderer);
    const scenePass = pass(scene, camera, {
      storeMultisampledColorBuffer: false,
      storeMultisampledDepthBuffer: false,
      storeMultisampledStencilBuffer: false,
      resolveColorBuffer: true,
      resolveDepthBuffer: false,
      resolveStencilBuffer: false,
    });
    const scenePassColor = scenePass.getTextureNode('output');
    const bloomPass = bloom(scenePassColor, 0.28, 0.32, 0.9);
    renderPipeline.outputNode = scenePassColor.add(bloomPass);
    return {
      enabled: true,
      bloomPass,
      render() {
        renderPipeline.render();
      },
    };
  } catch (err) {
    console.warn('bloom soft-fail', err);
    return fallback;
  }
}
