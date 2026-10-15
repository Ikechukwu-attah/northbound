# Northbound human characters

These locally hosted glTF 2.0 binary models contain real skinned meshes, a humanoid skeleton, readable geometric faces, and skeletal animation clips. They are not generated image assets.

## Provenance and licence

Original meshes, materials, rigs and the 24 `CharacterArmature|…` clips: **Quaternius**, released under **Creative Commons CC0 1.0 Universal**. Attribution is not required; credit is retained here.

- Official men pack and licence: https://quaternius.com/packs/ultimatemodularcharacters.html
- Official women pack and licence: https://quaternius.com/packs/ultimatemodularwomen.html
- Licence: https://creativecommons.org/publicdomain/zero/1.0/
- `casual.glb`: Casual Character, https://poly.pizza/m/kZ3DmIoGip
- `hoodie.glb`: Hoodie Character, https://poly.pizza/m/gKLBoRsyKe
- `casual-female.glb`: Animated Woman, https://poly.pizza/m/qJ2gsTUBHL
- Retrieved and licence checked: 2026-10-14.

The seven `Northbound|…` clips are original programmatically authored additions for this project. They use the existing skeleton with inspected joint orientations and world-space limb targets. They are simple authored poses and cycles, not motion capture or motions from Mixamo. These additions are also dedicated under CC0 1.0. The source animation authoring script is `author-animations.mjs`.

The original clip set is retained. Gameplay should use Idle/Idle_Neutral, Walk, Run, Wave and Interact; the combat clips are not required by Northbound.

## Runtime contract

- Each file contains **31 clips**: 24 source clips and 7 original additions.
- Source prefix: `CharacterArmature|`.
- Supplemental clips: `Northbound|Sit`, `Northbound|Wait`, `Northbound|Talk`, `Northbound|Phone`, `Northbound|Coffee`, `Northbound|Bike`, `Northbound|Carry_Bag`.
- Models are approximately **1.8 units high**, feet approximately at y=0, facing **+Z**.
- Visible-model scale can be increased independently of the world map scale. A height of 4–5 world units makes the face and clothes readable.
- Runtime bone names are sanitized by Three.js: `Head`, `Chest`, `UpperArmL`, `LowerArmL`, `WristL`, `UpperArmR`, `LowerArmR`, `WristR`, `UpperLegL`, `LowerLegL`, `FootL` and corresponding right-side names.
- Skeleton hierarchy and dimensions are recorded per variant in `manifest.json`.
- Important: the authoring rig has inherited scale. Use each bone's world transform and inverse world scale when attaching props; do not assume bone-local coordinates are metres.
- Use `SkeletonUtils.clone` for independent characters. Clone materials per character before changing colours. Share the original geometries and animation clips.
- Supplemental props (phone, coffee cup, bag and bicycle) must be supplied by the game. The clips position the hands/legs; the GLBs do not contain those objects.
- Sit and Bike lower the hips. Their feet stay in world contact positions; do not add an extra model-wide downward offset.

## Customization materials

| Variant | Skin | Hair/face | Top | Bottom | Shoes |
| --- | --- | --- | --- | --- | --- |
| casual | Skin, Skin_Darker | Hair, Eyebrows, Eye | LightBrown | LightBlue | White, Red_Dark |
| hoodie | Skin | Hair, Eyebrows, Eye | Purple on Casual_Body | LightBlue | White, Purple on Casual_Feet |
| casual-female | Skin | Hair_Blond, Hair_Brown; Brown is face detail | White on Casual_Body | Orange | Grey |

Use mesh names as well as material names: e.g. recolouring a hoodie top must not inadvertently recolour its shoes. Female face details share `Brown`; do not recolour all brown features as hair. The hairstyles are existing mesh parts; runtime variants can replace/hide hair primitives or attach original additions.

## Verification

All three GLBs were parsed with the project's Three.js GLTFLoader. Every animation track resolves to an existing scene node. Each supplementary animation was sampled with AnimationMixer and produced finite bone matrices. A CPU projection of skinned geometry was visually inspected for idle, sit, phone, coffee, bicycle and talk poses. Browser/WebGL performance and final accessory attachment are integration checks.
