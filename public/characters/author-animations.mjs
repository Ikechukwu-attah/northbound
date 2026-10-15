// Original Northbound supplemental skeletal clips. Run from repository root.
// Input models are Quaternius CC0. See README.md. No third-party motions added.
import { readFileSync, writeFileSync } from 'node:fs';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { AnimationClip, AnimationMixer, Box3, Quaternion, QuaternionKeyframeTrack, Vector3, VectorKeyframeTrack } from 'three';

globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then(value => { this.result = value; this.onloadend?.(); }); }
  readAsDataURL(blob) { blob.arrayBuffer().then(value => { this.result = `data:${blob.type};base64,${Buffer.from(value).toString('base64')}`; this.onloadend?.(); }); }
};

const modes = { Sit: 3, Wait: 4, Talk: 2.4, Phone: 3.6, Coffee: 4.8, Bike: 1.2, Carry_Bag: 3 };
const manifest = [];
for (const variant of ['casual', 'hoodie', 'casual-female']) {
  const path = new URL(`./${variant}.glb`, import.meta.url);
  const bytes = readFileSync(path);
  const gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
  const scene = gltf.scene;
  const bones = [];
  scene.traverse(node => { if (node.isBone) bones.push(node); });
  const get = name => scene.getObjectByName(name);
  const mixer = new AnimationMixer(scene);
  mixer.clipAction(gltf.animations.find(clip => clip.name.endsWith('|Idle_Neutral'))).play();
  mixer.setTime(.4);
  scene.updateMatrixWorld(true);
  const rest = bones.map(bone => ({ bone, p: bone.position.clone(), q: bone.quaternion.clone(), s: bone.scale.clone() }));
  const pos = name => get(name).getWorldPosition(new Vector3());
  const shift = (name, x, y, z) => {
    const bone = get(name);
    bone.position.copy(bone.parent.worldToLocal(pos(name).add(new Vector3(x, y, z))));
    scene.updateMatrixWorld(true);
  };
  const aim = (name, child, target) => {
    const bone = get(name), origin = pos(name);
    const oldDirection = pos(child).sub(origin).normalize();
    const newDirection = new Vector3(...target).sub(origin).normalize();
    const world = bone.getWorldQuaternion(new Quaternion());
    world.premultiply(new Quaternion().setFromUnitVectors(oldDirection, newDirection));
    bone.quaternion.copy(bone.parent.getWorldQuaternion(new Quaternion()).invert().multiply(world));
    scene.updateMatrixWorld(true);
  };
  const arm = (side, elbow, hand) => {
    aim(`UpperArm${side}`, `LowerArm${side}`, elbow);
    aim(`LowerArm${side}`, `Wrist${side}`, hand);
  };
  const leg = (side, knee, ankle) => {
    aim(`UpperLeg${side}`, `LowerLeg${side}`, knee);
    aim(`LowerLeg${side}`, `LowerLeg${side}_end`, ankle);
    const foot = get(`Foot${side}`);
    foot.position.copy(foot.parent.worldToLocal(new Vector3(...ankle)));
    scene.updateMatrixWorld(true);
  };
  const originals = gltf.animations.filter(clip => !clip.name.startsWith('Northbound|'));
  const supplemental = [];
  for (const [mode, duration] of Object.entries(modes)) {
    const samples = 25, times = [], values = new Map(bones.map(bone => [bone.name, { p: [], q: [] }]));
    for (let frame = 0; frame < samples; frame++) {
      const t = frame / (samples - 1), wave = Math.sin(t * Math.PI * 2), breath = Math.sin(t * Math.PI * 4);
      times.push(t * duration);
      for (const { bone, p, q, s } of rest) { bone.position.copy(p); bone.quaternion.copy(q); bone.scale.copy(s); }
      scene.updateMatrixWorld(true);
      shift('Body', .006 * wave, .006 * breath, 0);
      if (mode === 'Sit') {
        shift('Body', 0, -.38, -.05);
        leg('L', [.14, .49, .37], [.14, .035, .39]); leg('R', [-.14, .49, .37], [-.14, .035, .39]);
        arm('L', [.25, .78, .10], [.14, .60, .35]); arm('R', [-.25, .78, .10], [-.14, .60, .35]);
      } else if (mode === 'Wait') {
        shift('Body', .018 * wave, 0, 0);
        arm('L', [.24, 1.20, .07], [.21, 1.02, .11]); arm('R', [-.24, 1.20, .07], [-.21, 1.02, .11]);
      } else if (mode === 'Talk') {
        arm('R', [-.25, 1.18, .10], [-.25 + .06 * wave, 1.25 + .05 * breath, .32]);
        arm('L', [.24, 1.18, .10], [.24 - .04 * wave, 1.16 - .03 * breath, .28]);
        get('Head').quaternion.multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), .055 * wave));
      } else if (mode === 'Phone') {
        arm('R', [-.22, 1.15, .14], [-.10, 1.34, .36]);
        arm('L', [.22, 1.16, .13], [.03 + .015 * wave, 1.30, .35]);
        get('Head').quaternion.multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), .19));
      } else if (mode === 'Coffee') {
        const sip = Math.max(0, wave);
        arm('R', [-.25, 1.20, .12], [-.16 + .08 * sip, 1.20 + .33 * sip, .31 - .09 * sip]);
      } else if (mode === 'Bike') {
        shift('Body', 0, -.24, -.09);
        arm('L', [.25, 1.07, .18], [.25, .97, .43]); arm('R', [-.25, 1.07, .18], [-.25, .97, .43]);
        for (const [side, sign] of [['L', 1], ['R', -1]]) {
          const angle = t * Math.PI * 2 + (side === 'L' ? 0 : Math.PI);
          leg(side, [sign * .14, .59 + .08 * Math.cos(angle), .34], [sign * .14, .23 + .15 * Math.cos(angle), .10 + .15 * Math.sin(angle)]);
        }
      } else if (mode === 'Carry_Bag') {
        arm('R', [-.27, 1.20, .04], [-.28, .99, .07]);
      }
      scene.updateMatrixWorld(true);
      for (const bone of bones) {
        values.get(bone.name).p.push(...bone.position.toArray());
        values.get(bone.name).q.push(...bone.quaternion.toArray());
      }
    }
    const tracks = [];
    const compact = (value, width) => value.every((n, i) => Math.abs(n - value[i % width]) < 1e-7) ? { times: [0], values: value.slice(0, width) } : { times, values: value };
    for (const [name, value] of values) {
      const p = compact(value.p, 3), q = compact(value.q, 4);
      tracks.push(new VectorKeyframeTrack(`${name}.position`, p.times, p.values));
      tracks.push(new QuaternionKeyframeTrack(`${name}.quaternion`, q.times, q.values));
    }
    supplemental.push(new AnimationClip(`Northbound|${mode}`, duration, tracks));
  }
  // Restore source pose before export; preserve all 24 source clips.
  mixer.setTime(0);
  for (const { bone, p, q, s } of rest) { bone.position.copy(p); bone.quaternion.copy(q); bone.scale.copy(s); }
  scene.updateMatrixWorld(true);
  const box = new Box3().setFromObject(scene);
  const materials = new Set(); let triangles = 0;
  scene.traverse(node => { if (node.isMesh) { materials.add(node.material.name); triangles += (node.geometry.index?.count ?? node.geometry.attributes.position.count) / 3; } });
  const output = await new GLTFExporter().parseAsync(scene, { binary: true, animations: [...originals, ...supplemental] });
  writeFileSync(path, Buffer.from(output));
  manifest.push({ variant, bytes: output.byteLength, triangles, height: box.max.y - box.min.y, bounds: { min: box.min.toArray(), max: box.max.toArray() }, bones: bones.map(bone => ({ name: bone.name, parent: bone.parent.name })), materials: [...materials], clips: [...originals, ...supplemental].map(clip => ({ name: clip.name, duration: clip.duration, tracks: clip.tracks.length })) });
  console.log(variant, output.byteLength, 'bytes;', originals.length, 'source clips;', supplemental.length, 'original supplemental clips');
}
writeFileSync(new URL('./manifest.json', import.meta.url), JSON.stringify(manifest, null, 2));
