// Turns a rigged character (FBX: from mixamo.com, "With Skin", T-pose; or a Microsoft Rocketbox avatar, its Biped rig
// renamed to Mixamo's) into a glTF the game loads, and adds it to the Locker's list (src/figure/characters.json).
// Blender does the conversion, in the background: it imports the FBX, finds its textures, shrinks them to 1024 px and
// exports a binary glTF with them packed in. The game fits it to the Y Bot's skeleton as it loads (src/figure/fit.js),
// so nothing else is needed.
//
//   node tools/characters/convert.mjs <character.fbx> <id> "<Name>"
//
// BLENDER can name the Blender executable; otherwise the usual install folders are tried.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const [ input, id, name = id ] = process.argv.slice( 2 );
if ( ! input || ! id || ! /^[a-z0-9_-]+$/.test( id ) ) {

	console.error( 'usage: node tools/characters/convert.mjs <character.fbx> <id: a-z 0-9 _ -> "<Name>"' );
	process.exit( 1 );

}

function findBlender() {

	if ( process.env.BLENDER ) return process.env.BLENDER;
	const roots = [ 'C:/Program Files/Blender Foundation', '/Applications/Blender.app/Contents/MacOS', '/usr/bin' ];
	for ( const root of roots ) {

		if ( ! fs.existsSync( root ) ) continue;
		if ( fs.existsSync( path.join( root, 'blender' ) ) ) return path.join( root, 'blender' );
		const versions = fs.readdirSync( root ).filter( ( d ) => /^Blender/.test( d ) ).sort().reverse();
		for ( const v of versions ) {

			const exe = path.join( root, v, 'blender.exe' );
			if ( fs.existsSync( exe ) ) return exe;

		}

	}

	throw new Error( 'Blender not found: set BLENDER to its executable' );

}

const output = path.resolve( 'public', 'characters', `${id}.glb` );
const script = path.join( os.tmpdir(), `runoff-convert-${process.pid}.py` );
fs.writeFileSync( script, `
import bpy, sys, os
args = sys.argv[ sys.argv.index( '--' ) + 1: ]
source, target = args[ 0 ], args[ 1 ]
bpy.ops.wm.read_factory_settings( use_empty = True )
bpy.ops.import_scene.fbx( filepath = source, use_image_search = True )

# Textures the FBX names by a path of its author's: looked for by name beside the FBX (and in a Textures folder next to
# it, as Rocketbox keeps them); what is not found is dropped.
here = os.path.dirname( source )
folders = [ here, os.path.join( here, 'Textures' ), os.path.join( here, '..', 'Textures' ) ]
for image in list( bpy.data.images ):
    if image.packed_file or ( image.filepath and os.path.exists( bpy.path.abspath( image.filepath ) ) ):
        continue
    name = os.path.basename( image.filepath.replace( chr( 92 ), '/' ) )
    found = next( ( os.path.join( f, name ) for f in folders if name and os.path.exists( os.path.join( f, name ) ) ), None )
    if found:
        image.filepath = found
        image.reload()
        continue
    for material in bpy.data.materials:
        if material.node_tree:
            for node in list( material.node_tree.nodes ):
                if node.type == 'TEX_IMAGE' and node.image == image:
                    material.node_tree.nodes.remove( node )
    bpy.data.images.remove( image )

# A 3ds Max Biped (Microsoft Rocketbox's rig, "Bip01 ..."): its bones renamed to Mixamo's, and the thighs and
# clavicles hung where Mixamo hangs them (the hips, the top of the spine), so the fit and the takes treat it as one.
SIDES = { 'L': 'Left', 'R': 'Right' }
CENTRE = { 'Pelvis': 'Hips', 'Spine': 'Spine', 'Spine1': 'Spine1', 'Spine2': 'Spine2', 'Neck': 'Neck', 'Head': 'Head' }
LIMB = { 'Clavicle': 'Shoulder', 'UpperArm': 'Arm', 'Forearm': 'ForeArm', 'Hand': 'Hand', 'Thigh': 'UpLeg', 'Calf': 'Leg', 'Foot': 'Foot', 'Toe0': 'ToeBase' }
FINGERS = { '0': 'Thumb', '1': 'Index', '2': 'Middle', '3': 'Ring', '4': 'Pinky' }
def mixamo( name ):
    if not name.startswith( 'Bip01 ' ):
        return None
    rest = name[ 6: ]
    if rest in CENTRE:
        return CENTRE[ rest ]
    parts = rest.split( ' ' )
    if len( parts ) == 2 and parts[ 0 ] in SIDES:
        side, bone = SIDES[ parts[ 0 ] ], parts[ 1 ]
        if bone in LIMB:
            return side + LIMB[ bone ]
        # Finger0 (the base), Finger01, Finger02: segments 1, 2, 3.
        if bone.startswith( 'Finger' ) and len( bone ) in ( 7, 8 ):
            return side + 'Hand' + FINGERS[ bone[ 6 ] ] + str( 1 if len( bone ) == 7 else int( bone[ 7 ] ) + 1 )
    return None
biped = None
for armature in [ o for o in bpy.data.objects if o.type == 'ARMATURE' ]:
    if not any( b.name.startswith( 'Bip01 ' ) for b in armature.data.bones ):
        continue
    biped = armature
    for bone in armature.data.bones:
        name = mixamo( bone.name )
        if name:
            bone.name = 'mixamorig:' + name
    bpy.context.view_layer.objects.active = armature
    bpy.ops.object.mode_set( mode = 'EDIT' )
    edit = armature.data.edit_bones
    for side in ( 'Left', 'Right' ):
        for child, parent in ( ( 'UpLeg', 'Hips' ), ( 'Shoulder', 'Spine2' ) ):
            b, p = edit.get( 'mixamorig:' + side + child ), edit.get( 'mixamorig:' + ( parent ) )
            if b and p:
                b.use_connect = False
                b.parent = p
    bpy.ops.object.mode_set( mode = 'OBJECT' )
for empty in [ o for o in bpy.data.objects if o.type == 'EMPTY' and 'Footsteps' in o.name ]:
    bpy.data.objects.remove( empty )

# A Biped stands in an A-pose; the fit keeps every joint where the character's T-pose puts it, so the character gets a
# 'TPose' clip (the fit poses it by that first): each limb turned to point as the Y Bot's does at its rest, the hands
# also turned about it to lay their knuckles as the Y Bot's lie. Directions from the Y Bot's rest (three's frame: y up,
# facing +z) into Blender's (z up), turned about up to face as this character faces.
if biped:
    import json
    from mathutils import Matrix, Vector
    YB = json.load( open( args[ 2 ] ) )[ 'bones' ]
    def yb( name ):
        p = YB[ 'mixamorig' + name ][ 'p' ]
        return Vector( ( p[ 0 ], - p[ 2 ], p[ 1 ] ) )
    world = biped.matrix_world
    pose = biped.pose.bones
    def at( name ):
        return world @ pose[ 'mixamorig:' + name ].head
    left, ybLeft = ( at( 'LeftUpLeg' ) - at( 'Hips' ) ), ( yb( 'LeftUpLeg' ) - yb( 'Hips' ) )
    left.z = ybLeft.z = 0
    facing = ybLeft.rotation_difference( left ).to_matrix().to_4x4()
    def want( a, b ):
        return ( facing @ ( yb( b ) - yb( a ) ) ).normalized()
    def turn( name, rotation ):
        pb = pose[ 'mixamorig:' + name ]
        head = world @ pb.head
        moved = Matrix.Translation( head ) @ rotation.to_matrix().to_4x4() @ Matrix.Translation( - head ) @ world @ pb.matrix
        pb.matrix = world.inverted() @ moved
        bpy.context.view_layer.update()
    CHAINS = [ ( 'Spine', 'Spine1' ), ( 'Spine1', 'Spine2' ), ( 'Spine2', 'Neck' ), ( 'Neck', 'Head' ) ]
    for side in ( 'Left', 'Right' ):
        CHAINS += [ ( side + 'Shoulder', side + 'Arm' ), ( side + 'Arm', side + 'ForeArm' ), ( side + 'ForeArm', side + 'Hand' ), ( side + 'Hand', side + 'HandMiddle1' ),
                    ( side + 'UpLeg', side + 'Leg' ), ( side + 'Leg', side + 'Foot' ), ( side + 'Foot', side + 'ToeBase' ) ]
        for finger in ( 'Thumb', 'Index', 'Middle', 'Ring', 'Pinky' ):
            CHAINS += [ ( side + 'Hand' + finger + '1', side + 'Hand' + finger + '2' ), ( side + 'Hand' + finger + '2', side + 'Hand' + finger + '3' ) ]
    bpy.context.view_layer.objects.active = biped
    bpy.ops.object.mode_set( mode = 'POSE' )
    for a, b in CHAINS:
        if 'mixamorig:' + a not in pose or 'mixamorig:' + b not in pose or 'mixamorig' + a not in YB or 'mixamorig' + b not in YB:
            continue
        turn( a, ( at( b ) - at( a ) ).normalized().rotation_difference( want( a, b ) ) )
        # The hand also about its own length: its knuckles (index to pinky) laid as the Y Bot's.
        if a.endswith( 'Hand' ):
            axis = want( a, b )
            side = a[ : - 4 ]
            def flat( v ):
                return ( v - axis * v.dot( axis ) ).normalized()
            have = flat( at( side + 'HandPinky1' ) - at( side + 'HandIndex1' ) )
            need = flat( facing @ ( yb( side + 'HandPinky1' ) - yb( side + 'HandIndex1' ) ) )
            turn( a, have.rotation_difference( need ) )
    for action in list( bpy.data.actions ):
        bpy.data.actions.remove( action )
    biped.animation_data_create()
    biped.animation_data.action = bpy.data.actions.new( 'TPose' )
    for pb in pose:
        pb.keyframe_insert( 'rotation_quaternion', frame = 0 )
        pb.keyframe_insert( 'location', frame = 0 )
    bpy.ops.object.mode_set( mode = 'OBJECT' )
    open( target + '.biped', 'w' ).close()

# Textures at most 1024 px; the ones nothing reads the alpha of as JPEG (a fraction of PNG's size). Surfaces matte,
# not metal (the specular maps were dropped).
alpha = set()
for material in bpy.data.materials:
    if not material.node_tree:
        continue
    for link in material.node_tree.links:
        if link.from_node.type == 'TEX_IMAGE' and link.from_socket.name == 'Alpha' and link.from_node.image:
            alpha.add( link.from_node.image.name )
            material.blend_method = 'CLIP'
    for node in material.node_tree.nodes:
        if node.type == 'BSDF_PRINCIPLED':
            node.inputs[ 'Metallic' ].default_value = 0
            if not node.inputs[ 'Roughness' ].is_linked:
                node.inputs[ 'Roughness' ].default_value = 0.75
out = os.path.join( os.path.dirname( target ), '_convert_textures' )
os.makedirs( out, exist_ok = True )
for image in bpy.data.images:
    if image.size[ 0 ] == 0:
        continue
    if max( image.size ) > 1024:
        w, h = image.size
        k = 1024 / max( w, h )
        image.scale( max( 1, round( w * k ) ), max( 1, round( h * k ) ) )
    jpeg = image.name not in alpha
    path = os.path.join( out, bpy.path.clean_name( image.name ) + ( '.jpg' if jpeg else '.png' ) )
    image.filepath_raw = path
    image.file_format = 'JPEG' if jpeg else 'PNG'
    image.save()
bpy.ops.file.pack_all()
bpy.ops.export_scene.gltf( filepath = target, export_format = 'GLB', export_yup = True, export_skins = True, export_animations = True, export_apply = False, export_image_format = 'AUTO', export_jpeg_quality = 88 )
` );

execFileSync( findBlender(), [ '--background', '--factory-startup', '--python', script, '--', path.resolve( input ), output, path.resolve( 'src/figure/ybot-rest.json' ) ], { stdio: [ 'ignore', 'inherit', 'inherit' ] } );
fs.rmSync( script );
const biped = fs.existsSync( `${output}.biped` );
fs.rmSync( `${output}.biped`, { force: true } );
fs.rmSync( path.join( path.dirname( output ), '_convert_textures' ), { recursive: true, force: true } );

const listFile = 'src/figure/characters.json';
const list = JSON.parse( fs.readFileSync( listFile, 'utf8' ) ).filter( ( c ) => c.id !== id );
// New characters go before the Y Bot, which stays last.
list.splice( list.length - 1, 0, { id, name, model: `characters/${id}.glb`, fit: true, from: biped ? 'Rocketbox runner' : 'Mixamo runner' } );
const entry = ( c ) => `{ ${Object.entries( c ).map( ( [ key, value ] ) => `${JSON.stringify( key )}: ${JSON.stringify( value )}` ).join( ', ' )} }`;
fs.writeFileSync( listFile, '[\n' + list.map( ( c ) => '\t' + entry( c ) ).join( ',\n' ) + '\n]\n' );
console.log( `convert: ${path.relative( '.', output )} (${( fs.statSync( output ).size / 1048576 ).toFixed( 1 )} MB), added "${name}" to ${listFile}` );
