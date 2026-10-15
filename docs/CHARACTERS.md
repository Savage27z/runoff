# Your own runners from Mixamo

Every runner shares the Y Bot's mocap, so any character Mixamo rigs can run the courses. Mixamo needs an Adobe
sign-in, so the download is yours; the rest is one command.

1. Go to [mixamo.com](https://www.mixamo.com), sign in, and open **Characters**. Pick one (or upload your own model
   and let Mixamo rig it).
2. **Download** with: Format **FBX Binary (.fbx)**, Pose **T-pose**, Skin **With Skin**. No animation is needed.
3. Put the `.fbx` in `characters-in/` at the project's root. Its file name becomes the runner's name: `Dark Elf.fbx`
   is the runner "Dark Elf".
4. Run:

   ```bash
   npm run add-characters
   ```

   Each new file is converted to a glTF in `public/characters/` (Blender does it, in the background; set `BLENDER` to
   its executable if it is not in the usual place), added to the Locker's list (`src/figure/characters.json`), and
   checked against the Y Bot's skeleton: every limb should point the same way within a few degrees.
5. Start the game (`npm run dev`) and pick the runner in the **Locker**. The gear fits it by its own head.

A character Mixamo rigged keeps the Mixamo bone names, which is all the fit needs. If one looks wrong in a pose, run
`node tools/characters/check-fit.mjs public/characters/<id>.glb` to see which limb is off.

## Microsoft Rocketbox avatars

Kestrel, Dash, Striker, Winger, Spark, Talon, Echo and Juno are [Microsoft Rocketbox](https://github.com/microsoft/Microsoft-Rocketbox)
avatars (Sports_Female_02, Sports_Male_04, _02, _03; Female_Adult_12, _04, _08, _17), MIT licensed:
`public/characters/LICENSE-rocketbox.md`.
More of the library's 115 avatars convert the same way: download an avatar's `Export/<name>.fbx` and its `Textures/`
(the `_color` and `_normal` maps; the specular maps are not used) keeping the two folders side by side, then:

```bash
node tools/characters/convert.mjs <avatar>/Export/<name>.fbx <id> "<Name>"
```

The converter sees the 3ds Max Biped rig, renames its bones to Mixamo's, hangs the thighs and clavicles where Mixamo
does, and gives the avatar a T-pose clip (its own rest is an A-pose) for the fit; they fit the Y Bot within a degree.
