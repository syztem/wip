/** Bloom is opt-in via dynamic import. BloomNode constructs QuadMesh at
 *  module eval — that hangs Safari and is why it must not load on the default Safari path. */

export async function tryCreateBloom(renderer, scene, camera) {
  const { RenderPipeline } = await import('three/webgpu');
  const { pass } = await import('three/tsl');
  const { bloom } = await import('three/addons/tsl/display/BloomNode.js');

  const renderPipeline = new RenderPipeline(renderer);
  const scenePass = pass(scene, camera);
  const scenePassColor = scenePass.getTextureNode('output');
  // threshold high so sky stays out; rose / gold / motes in
  const bloomPass = bloom(scenePassColor, 0.42, 0.32, 0.84);
  renderPipeline.outputNode = scenePassColor.add(bloomPass);

  return {
    enabled: true,
    bloomPass,
    render() {
      renderPipeline.render();
    },
  };
}

export function createPost(renderer, scene, camera) {
  return {
    enabled: false,
    bloomPass: null,
    render() {
      renderer.render(scene, camera);
    },
  };
}
