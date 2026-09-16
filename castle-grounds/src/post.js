/** Bloom is opt-in later via dynamic import. BloomNode constructs QuadMesh at
 *  module eval — that hangs Safari and is why it must not load on the default path. */
export function createPost(renderer, scene, camera) {
  return {
    enabled: false,
    bloomPass: null,
    render() {
      renderer.render(scene, camera);
    },
  };
}
