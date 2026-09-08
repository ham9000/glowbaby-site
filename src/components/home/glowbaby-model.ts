import * as THREE from "three";
import { heroSceneConfig } from "./hero-scene-config";

export function alignGlowbabyParts(bottom: THREE.Object3D, top: THREE.Object3D) {
  const baseCenter = new THREE.Box3().setFromObject(bottom).getCenter(new THREE.Vector3());
  const topBounds = new THREE.Box3().setFromObject(top);
  const topCenter = topBounds.getCenter(new THREE.Vector3());
  const topHeight = topBounds.max.y - topBounds.min.y;
  bottom.position.x -= baseCenter.x;
  bottom.position.z -= baseCenter.z;

  // Turn the authored flat underside upward about the lid's own center.
  top.position.sub(topCenter);
  const lid = new THREE.Group();
  lid.name = "GlowbabyLid";
  lid.rotation.x = Math.PI;
  lid.position.set(
    topCenter.x - baseCenter.x,
    heroSceneConfig.assembly.topOffset - heroSceneConfig.assembly.topInset + topHeight / 2,
    topCenter.z - baseCenter.z,
  );
  lid.add(top);
  return lid;
}
