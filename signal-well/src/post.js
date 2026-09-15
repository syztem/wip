import * as THREE from 'three/webgpu';
import { pass } from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';

/** TSL bloom: pass → bloom → add. Loop must call pipeline.render(), not renderer.render. */
export function createPost(renderer, scene, camera) {
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
    const bloomPass = bloom(scenePassColor, 0.45, 0.4, 0.9);
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
    return {
      enabled: false,
      bloomPass: null,
      render() {
        renderer.render(scene, camera);
      },
    };
  }
}
