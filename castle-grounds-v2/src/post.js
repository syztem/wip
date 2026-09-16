import { PostProcessing } from 'three/webgpu';
import { pass, screenUV, smoothstep, float, vec2, vec3, mix } from 'three/tsl';

const GRADE_DEFAULTS = { contrast: 1.06, saturation: 1.08, vignette: 0.30 };

function applyGrade(color, { contrast = GRADE_DEFAULTS.contrast, saturation = GRADE_DEFAULTS.saturation, vignette = GRADE_DEFAULTS.vignette } = {}) {
  const c = color.rgb;
  const luma = c.dot(vec3(0.2126, 0.7152, 0.0722));
  const sat = mix(vec3(luma, luma, luma), c, float(saturation));
  const con = sat.mul(float(contrast));
  const d = screenUV.sub(vec2(0.5, 0.5));
  const r = d.dot(d).sqrt();
  const v = smoothstep(float(0.35), float(0.85), r);
  const vig = v.mul(float(vignette)).oneMinus();
  return con.mul(vig);
}

async function tryImport(spec) {
  try { return await import(spec); }
  catch (e) { console.warn(`post: ${spec} unavailable`, e); return null; }
}

export async function createPost(renderer, scene, camera, opts = {}) {
  const { bloom = false, dof = false, ao = false, grade = true } = opts;

  if (!bloom && !dof && !ao && !grade) {
    return {
      enabled: false,
      passes: [],
      grade: GRADE_DEFAULTS,
      render() { renderer.render(scene, camera); },
    };
  }

  const pp = new PostProcessing(renderer);
  const scenePass = pass(scene, camera);
  let color = scenePass.getTextureNode('output');
  const enabled = [];

  if (bloom) {
    const base = color;
    const mod = await tryImport('three/addons/tsl/display/BloomNode.js');
    if (mod?.bloom) { color = base.add(mod.bloom(base, 0.45, 0.35, 0.85)); enabled.push('bloom'); }
    else { color = base; }
  }

  if (ao) {
    const base = color;
    const mod = await tryImport('three/addons/tsl/display/GTAONode.js');
    if (mod?.ao) {
      const depth = scenePass.getTextureNode('depth');
      const normal = scenePass.getTextureNode('normal');
      const aoNode = mod.ao(depth, normal, camera);
      color = base.mul(aoNode.r);
      enabled.push('ao');
    } else { color = base; }
  }

  if (dof) {
    const base = color;
    const mod = await tryImport('three/addons/tsl/display/DepthOfFieldNode.js');
    if (mod?.dof) {
      const depth = scenePass.getTextureNode('depth');
      color = mod.dof(base, depth, 2.5, 0.025, 0.035);
      enabled.push('dof');
    } else { color = base; }
  }

  if (grade) { color = applyGrade(color); enabled.push('grade'); }

  pp.outputNode = color;

  let failed = false;
  return {
    enabled: enabled.length > 0,
    passes: enabled,
    grade: GRADE_DEFAULTS,
    render() {
      if (failed) { renderer.render(scene, camera); return; }
      try { pp.render(); }
      catch (e) {
        failed = true;
        console.warn('post: render failed, falling back to raw render', e);
        renderer.render(scene, camera);
      }
    },
  };
}
