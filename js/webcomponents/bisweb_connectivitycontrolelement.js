/*  LICENSE
 
 _This file is Copyright 2018 by the Image Processing and Analysis Group (BioImage Suite Team). Dept. of Radiology & Biomedical Imaging, Yale School of Medicine._
 
 BioImage Suite Web is licensed under the Apache License, Version 2.0 (the "License");
 
 - you may not use this software except in compliance with the License.
 - You may obtain a copy of the License at [http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0)
 
 __Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.__
 
 ENDLICENSE */

/* global window,document,setTimeout,HTMLElement,Event,Image*/


"use strict";

const numeric=require('numeric');
const UndoStack=require('bis_undostack');
const bisweb_image = require('bisweb_image');
const util=require('bis_util');
const BisConnectivityMatrix=require('bis_connmatrix');
const webutil=require('bis_webutil');
const bisgenericio=require('bis_genericio');
const bisCrossHair=require('bis_3dcrosshairgeometry');
const BisParcellation=require('bis_parcellation');
const $=require('jquery');
const bootbox=require('bootbox');
const bismni2tal=require('bis_mni2tal');
const THREE=require('three');

import dat from 'dat.gui';

// -------------------------------------------------------------------------
const brain_vertexshader_text = 
      'attribute vec3 lookupScalar;\n'+
      'varying vec3 vNormal;\n'+
      //        'varying vec3 vLookup;\n'+
      'void main() {\n'+
      //        '     vLookup.x=lookupScalar.x;\n'+
      //        '     vLookup.y=lookupScalar.y;\n'+
      //        '     vLookup.z=lookupScalar.z;\n'+
      '     vNormal = normalize( normalMatrix * normal );\n'+
      '     vec3 transformed = vec3( position );\n'+
      '     vec4 mvPosition = modelViewMatrix * vec4( transformed, 1.0 );\n'+
      '     gl_Position = projectionMatrix * mvPosition;\n'+
      '     gl_Position.z=0.99+0.01*gl_Position.z;\n'+
      '}\n';

const brain_fragmentshader_text=
      'uniform float opacity;\n'+
      'uniform vec3 diffuse;\n'+
      'varying vec3 vNormal;\n'+
      //        'varying vec3 vLookup;\n'+
      'void main() {\n'+
      '   float v=max(0.0,-vNormal.z)*0.7+0.3;\n'+
      '   gl_FragColor = vec4( v*diffuse.x,v*diffuse.y,v*diffuse.z, opacity );\n'+
      '}';

const sphere_vertexshader_text = 
      'varying vec3 vNormal;\n'+
      'void main() {\n'+
      '     vNormal = normalize( normalMatrix * normal );\n'+
      '     vec3 transformed = vec3( position );\n'+
      '     vec4 mvPosition = modelViewMatrix * vec4( transformed, 1.0 );\n'+
      '     gl_Position = projectionMatrix * mvPosition;\n'+
      '}\n';

const sphere_fragmentshader_text=
      'uniform float opacity;\n'+
      'uniform vec3 diffuse;\n'+
      'varying vec3 vNormal;\n'+
      'void main() {\n'+
      '   float v=max(0.0,-vNormal.z);\n'+
      '   gl_FragColor = vec4( v*diffuse.x,v*diffuse.y,v*diffuse.z, opacity );\n'+
      '}';

// -------------------------------------------------------------------------

const gui_Lobes = {
    1: 'R-Prefrontal',
    2: 'R-MotorStrip',  3: 'R-Insula',
    4: 'R-Parietal',    5: 'R-Temporal',
    6: 'R-Occipital',   7: 'R-Limbic',
    8: 'R-Cerebellum',  9: 'R-Subcortical',
    10: 'R-Brainstem', 11: 'L-Prefrontal',
    12: 'L-MotorStrip',13: 'L-Insula',
    14: 'L-Parietal',  15: 'L-Temporal',
    16: 'L-Occipital', 17: 'L-Limbic',
    18: 'L-Cerebellum',19: 'L-Subcortical',
    20: 'L-Brainstem' };

const gui_BrodLabels = {
    1 : 'PrimSensory (1)',   4 : 'PrimMotor (4)',
    5 : 'SensoryAssoc (5)',  6 : 'BA6',
    7 : 'BA7',              8 : 'BA8',
    9 : 'BA9',              10 : 'BA10',
    11 : 'BA11',            13 : 'Insula (13)',
    14 : 'BA14',            17 : 'PrimVisual (17)',
    18 : 'VisualAssoc (18)', 19 : 'BA19',
    20 : 'BA20',            21 : 'BA21',
    22 : 'BA22',            23 : 'BA23',
    24 : 'BA24',            25 : 'BA25',
    30 : 'BA30',            31 : 'BA31',
    32 : 'BA32',            34 : 'BA34',
    36 : 'Parahip (36)',     37 : 'Fusiform (37)',
    38 : 'BA38',            39 : 'BA39',
    40 : 'BA40',            41 : 'PrimAuditory (41)',
    44 : 'BA44',            45 : 'BA45',
    46 : 'BA46',            47 : 'BA47',
    48 : 'Caudate (48)',     49 : 'Putamen (49)',
    50 : 'Thalamus (50)',    51 : 'GlobPal (51)',
    52 : 'NucAccumb (52)',   53 : 'Amygdala (53)',
    54 : 'Hippocampus (54)', 55 : 'Hypothalamus (55)',
    58 : 'BrainStem',        57 : 'Cerebellum',
};

const gui_Lobes_Values = [ 'R-Prefrontal', 'R-MotorStrip',  'R-Insula',
                           'R-Parietal',   'R-Temporal',
                           'R-Occipital',   'R-Limbic',
                           'R-Cerebellum',  'R-Subcortical',
                           'R-Brainstem',  'L-Prefrontal',
                           'L-MotorStrip', 'L-Insula',
                           'L-Parietal',   'L-Temporal',
                           'L-Occipital',  'L-Limbic',
                           'L-Cerebellum', 'L-Subcortical',
                           'L-Brainstem' ];

const gui_Networks = {
    1:  'Somato-Motor',
    3:  'Cingular-opercular',
    4:  'Auditory',
    5:  'Default Mode',
    7:  'Visual',
    8:  'Frontal-Parietal',
    9:  'Salience',
    10: 'Subcortical',
    11: 'Ventral-Attention',
    12: 'Dorsal-Attention'
};

const gui_Networks_Values = [
    'Somato-Motor',
    'Cingular-opercular',
    'Auditory',
    'Default Mode',
    'Visual',
    'Frontal-Parietal',
    'Salience',
    'Subcortical',
    'Ventral-Attention',
    'Dorsal-Attention'];


const gui_Lines = [ 'Positive', 'Negative', 'Both'];

const gui_Modes = [ 'All', 'Single Node', 'Single Lobe','Single Network'];

const lobeoffset=10.0;
const axisoffset=[0,5.0,20.0];


// --------------------------------------------------------------------------------


const bisGUIConnectivityControl = function(parent,orthoviewer,layoutmanager) {

    // -------------------------------------------------------------------------
    // Control State variables
    // -------------------------------------------------------------------------

    var internal = {

        // global stuff
        initialized : false,
        this : null,
        parentDomElement : null,
        parcellation : null,
        conndata : new BisConnectivityMatrix(),
        domElement : null,
        orthoviewer : null,
        layoutmanager : layoutmanager,
        canvas : null,
        context: null,
        tmpcanvas : document.createElement("canvas"),
        overlaycanvas  : null,
        overlaycontext : null,
        overlaymode : false,
        mni2tal : null,
        mni : [ 0,0,0, -1 ],
        currentnode : 1,                
        // GUI Stuff
        posFileInfo : [ "NONE", 0 ],
        negFileInfo : [ "NONE", 0 ],

        // DAT
        datgui : null,
        parameters : {
            lobe : gui_Lobes[19],
            mode : gui_Modes[1],
            network : gui_Networks[10],
            node  : 200,
            linestodraw : gui_Lines[2],
            degreethreshold : 10,
            length : 50,
            thickness : 2,
            poscolor : "#ff0000",
            negcolor : "#00dddd",
            radius : 1.0,
            matrixthreshold : 0.1,
        },
        datgui_controllers : null,
        datgui_nodecontroller : null,
        datgui_degreethresholdcontroller : null,
        linestack : [],
        // Canvas mode
        undostack : new UndoStack(50),
        hadlinesonce : false,
        //
        keynodedlg : null,
        //
        showlegend : true,
        rendermode : 7,
        meshes : [ ],
        brainmesh : [ null,null],
        axisline  : [ null,null,null],
        planemesh : null,
        subviewers : null,
    };


    internal.conndata.offset=lobeoffset;

    // -------------------------------------------------------------------------
    // Undo Stuff
    // -------------------------------------------------------------------------
    var addStateToUndo = function() {
        var undoobj = {
            stack : internal.linestack
        };
        internal.undostack.addOperation([JSON.stringify(undoobj)]);
        
    };

    var getStateFromUndoOrRedo = function(doredo) {
        doredo=doredo || false;
        var elem;
        if (doredo)
            elem=internal.undostack.getRedo();
        else
            elem=internal.undostack.getUndo();

        if (elem === null) 
            return;
        
        var undoobj=JSON.parse(elem[0]);
        internal.linestack=undoobj.stack;
        console.log('\n\n\n ***** Parsed undo element numops='+internal.linestack.length);

        var max=internal.linestack.length-1;
        if (max>=0) {
            var state=internal.linestack[max];
            internal.parameters.mode=state.guimode;
            internal.parameters.node=state.node;
            internal.parameters.lobe=state.lobe;
            internal.parameters.network=state.network;
            internal.parameters.degreethreshold=state.degreethreshold;
            internal.parameters.linestodraw =state.linestodraw;
            internal.parameters.poscolor = state.poscolor;
            internal.parameters.negcolor = state.negcolor;
            internal.parameters.length = state.length;
            internal.parameters.thickness = state.thickness;
            internal.parameters.radius = state.radius;
            internal.parameters.matrixthreshold = state.matrixthreshold;
            for (var ia=0;ia<internal.datgui_controllers.length;ia++) 
                internal.datgui_controllers[ia].updateDisplay();
        }
        update();
    };

    // -------------------------------------------------------------------------
    // Draw Circles
    // -------------------------------------------------------------------------

    var toggleshowlegend = function() {

        internal.showlegend=!internal.showlegend;
        update(true);
        if (internal.showlegend) {
            setnode(Math.round(internal.parameters.node-1));
        } else if (internal.axisline[0]!==null) {
            internal.axisline[0].visible=false;
            internal.axisline[1].visible=false;
            internal.axisline[2].visible=false;
        }

    };


    // ----------------------------------------------------------------------------
    // Toggle Mode
    // ----------------------------------------------------------------------------
    var togglemode = function(doupdate) {

        if (doupdate!==false)
            doupdate=true;
        
        if (internal.parcellation===null)
            return;
        if (doupdate) {
            internal.rendermode=internal.rendermode+1;
            if (internal.rendermode>8)
                internal.rendermode=6;
        } 
        var vp=internal.orthoviewer.setRenderMode(internal.rendermode,true);
        var parcvp=vp[4];
        internal.parcellation.viewport.x0=parcvp.x0;
        internal.parcellation.viewport.x1=parcvp.x1;
        internal.parcellation.viewport.y0=1.0-parcvp.y1;
        internal.parcellation.viewport.y1=1.0-parcvp.y0;
        update(true);
        if (internal.showlegend)
            setnode(Math.round(internal.parameters.node-1));
    };
    
    // ----------------------------------------------------------------------------
    // Draw Matrices As Images
    // ----------------------------------------------------------------------------
    var drawMatricesInWindow = function() {
        if (internal.conndata.statMatrix===null) {
            bootbox.alert('No connectivity data loaded');
            return;
        }
        var numrows=internal.parcellation.rois.length;
        var tmpcanvas = internal.tmpcanvas;
        var tmpcontext = tmpcanvas.getContext("2d");
        tmpcanvas.width = numrows;
        tmpcanvas.height = numrows;
        var cw=internal.context.canvas.width*0.9;
        var padding_x=30;
        var padding_y=30;
        var scalefactor=((cw-3*padding_x)/(2*numrows));
        var ch=scalefactor*numrows+1.5*padding_y;
        var actualcanvas=document.createElement("canvas");
        actualcanvas.width=cw;
        actualcanvas.height=ch;
        var actualcontext=actualcanvas.getContext("2d");
        actualcontext.save();
        actualcontext.fillStyle="#bbbbbb";
        actualcontext.fillRect(0,0,cw,ch);
        var offsets= [ [ padding_x,
                         padding_y,
                         scalefactor*numrows ],
                       [ 2*padding_x+scalefactor*numrows,
                         padding_y,
                         scalefactor*numrows ] ];
        
        var names=[ 'Positive','Negative' ];
        for (var im=0;im<=1;im++) {
            var image = internal.conndata.getImageData(1-im,0,
                                                       actualcontext,
                                                       internal.parcellation);
            var minx=offsets[im][0],miny=offsets[im][1],sz=offsets[im][2];
            
            if (image!==null) {
                actualcontext.lineWidth=1;
                actualcontext.fillStyle="#000000";
                actualcontext.font=24+"px Arial";
                actualcontext.textAlign="center";
                actualcontext.fillText(names[im],minx+0.5*sz,miny-10);

                actualcontext.lineWidth=1;
                actualcontext.fillStyle="#ffffff";
                actualcontext.fillRect(minx,miny,sz,sz);
                actualcontext.beginPath();
                actualcontext.moveTo(minx-2,   miny-2);
                actualcontext.lineTo(minx+sz+2,miny-2);
                actualcontext.lineTo(minx+sz+2,miny+sz+2);
                actualcontext.lineTo(minx-2,   miny+sz+2);
                actualcontext.lineTo(minx-2,   miny-2);
                actualcontext.stroke();

                tmpcontext.putImageData(image,0,0);
                var ImageObject = new Image();
                ImageObject.src = tmpcanvas.toDataURL("image/png");
                
                
                actualcontext.drawImage(ImageObject,
                                        0,0,numrows,numrows,
                                        minx,miny,sz,sz);
            } 
        }
        actualcontext.restore();

        var outimg = actualcanvas.toDataURL("image/png");
        var a=webutil.creatediv();
        var wd=550;
        
        var dispimg = $('<img width="'+wd+'px">');
        dispimg.attr('src',outimg);
        a.append(dispimg);

        setTimeout(function() {
            bootbox.dialog({
                title: 'Connectivity Matrices',
                message: a.html(),
            });
        },1);
    };

    
    var drawMatricesAndLegendsAsImages = function() {

        if (internal.showlegend===false)
            return;
        
        if (internal.parcellation===null)
            return;
        
        if (internal.parcellation.lobeStats===null || 
            (internal.parcellation.viewport.x0 ===internal.parcellation.viewport.x1 ))
            return;

        if ((internal.parcellation.box[3]-internal.parcellation.box[1])<100)
            return;


        var cw=internal.context.canvas.width;
        var vp=internal.parcellation.viewport;
        var width  = Math.floor((vp.x1-vp.x0)*cw);
        var cnv={
            width : width,
        };
        var fnsize=webutil.getfontsize(cnv);
        var fnsize2=webutil.getfontsize(cnv,true);
        
        var originx= Math.floor(vp.x0*cw);
        var originy= internal.parcellation.box[1];
        var leftgap=internal.parcellation.box[0]-originx;
        var imagewidth=0.8*leftgap;

        var offset=0;
        var boxheight=internal.parcellation.box[3]-internal.parcellation.box[1];
        var numgaps=22;
        var dlobe=Math.round(1.5*fnsize);
        var needed=numgaps*dlobe+8;
        if (needed>boxheight) {
            dlobe=(boxheight-8)/numgaps;
        }
        needed=numgaps*dlobe+8;
        if (dlobe<0.75*fnsize || imagewidth<50)
            return;
        
        // Draw Legends
        var pw=0.8*leftgap;
        if (pw>8*fnsize)
            pw=8*fnsize;
        
        var px=width-pw-2;
        
        var py=originy+4+offset;
        var lobegap=dlobe;

        internal.overlaycontext.save();
        internal.overlaycontext.fillStyle="#cccccc";
        internal.overlaycontext.fillRect(px-4,py-4,pw+8,needed);
        internal.overlaycontext.fillStyle="#000000";
        internal.overlaycontext.textAlign="left";
        internal.overlaycontext.font=fnsize2+"px Arial";
        internal.overlaycontext.fillText("'Lobes'",px+5,py+lobegap);
        internal.overlaycontext.textAlign="center";
        internal.overlaycontext.font=fnsize+"px Arial";
        py+=(2*lobegap);
        
        for (var i=1;i<=10;i++) {
            var tot=util.range(internal.parcellation.lobeStats[i][2],0,10000),tot2=0;
            if (internal.parcellation.lobeStats.length>(i+10))
                tot2=util.range(internal.parcellation.lobeStats[i+10][2],0,10000);
            if (tot+tot2>0) {
                internal.overlaycontext.fillStyle=internal.parcellation.getNonSidedLobeColor(i);
                internal.overlaycontext.fillRect(px,py,pw,1.5*lobegap);
                internal.overlaycontext.fillStyle=internal.parcellation.getInverseNonSidedLobeColor(i);
                var name=gui_Lobes[i];
                name=name.slice(2,name.length);
                internal.overlaycontext.fillText(name,px+0.5*pw,py+lobegap);
                py+=(2*lobegap);
            }
        }
        
        
        var y0=fnsize2*2;
        if (y0<internal.parcellation.box[1]) {
            var midx=0.5*(internal.parcellation.box[0]+internal.parcellation.box[2]);
            internal.overlaycontext.fillStyle="rgb(0,0,0)";
            internal.overlaycontext.font=fnsize2+"px Arial";
            internal.overlaycontext.textAlign="center";
            internal.overlaycontext.clearRect(0,0,cw,internal.parcellation.box[1]-2);
            var y0_0=internal.parcellation.box[1]-0.5*(internal.parcellation.box[1]-fnsize2);
            internal.overlaycontext.fillText('Using node definitions from '+internal.parcellation.description+' with '+(internal.parcellation.rois.length)+' nodes.',
                                             midx,y0_0);
        }


        internal.overlaycontext.restore();
        
        var needed2=2*(imagewidth+25+4)+30;
        if (needed2>boxheight) {
            imagewidth=0.5*(needed2-30)-29;
        } else {
            originy+=0.5*(boxheight-needed2);
        }
        
        if (2*imagewidth+80>boxheight) {
            imagewidth=(boxheight-80)/2;
        }
        
        var offsets = [ [ originx+0.1*leftgap,
                          originy+30,
                          imagewidth ],
                        [ originx+0.1*leftgap,
                          originy+imagewidth+69,
                          imagewidth ]
                      ];

        var numrows=internal.parcellation.rois.length;      
        var tmpcanvas = internal.tmpcanvas;
        var tmpcontext = tmpcanvas.getContext("2d");
        tmpcanvas.width = numrows;
        tmpcanvas.height = numrows;

        var names=[ 'Positive','Negative' ];

        
        for (var im=0;im<=1;im++) {

            var image = internal.conndata.getImageData(1-im,0,
                                                       internal.overlaycontext,
                                                       internal.parcellation);
            var minx=offsets[im][0],miny=offsets[im][1],sz=offsets[im][2];
            
            if (image!==null) {
                
                internal.overlaycontext.save();
                internal.overlaycontext.lineWidth=1;
                internal.overlaycontext.fillStyle="rgb(0,0,0)";
                internal.overlaycontext.font=fnsize+"px Arial";
                internal.overlaycontext.lineWidth=1;
                internal.overlaycontext.textAlign="center";
                internal.overlaycontext.fillText(names[im],minx+0.5*sz,miny-10);
                
                internal.overlaycontext.lineWidth=1;
                internal.overlaycontext.fillStyle="#ffffff";
                internal.overlaycontext.fillRect(minx,miny,sz,sz);
                internal.overlaycontext.beginPath();
                internal.overlaycontext.moveTo(minx-2,   miny-2);
                internal.overlaycontext.lineTo(minx+sz+2,miny-2);
                internal.overlaycontext.lineTo(minx+sz+2,miny+sz+2);
                internal.overlaycontext.lineTo(minx-2,   miny+sz+2);
                internal.overlaycontext.lineTo(minx-2,   miny-2);
                internal.overlaycontext.stroke();
                
                tmpcontext.putImageData(image,0,0);
                var ImageObject = new Image();
                ImageObject.src = tmpcanvas.toDataURL("image/png");
                
                internal.overlaycontext.drawImage(ImageObject,
                                                  0,0,numrows,numrows,
                                                  minx,miny,sz,sz);
                internal.overlaycontext.restore();
            } 
        }

    };

    
    // Update Display skip3d -- if true skip 3d updates
    var update = function(skip3d) {

        skip3d=skip3d || false;
        if (internal.parcellation===null)
            return;

        var skip2d=false;
        
        if (internal.parcellation.viewport.x0 ===
            internal.parcellation.viewport.x1 ) {
            internal.context.clearRect(0,0,internal.canvas.width,internal.canvas.height);
            internal.overlaycontext.clearRect(0,0,internal.canvas.width,internal.canvas.height);
            skip2d=true;
        }

        if (skip2d && skip3d)
            return;
        
        var max=internal.linestack.length-1;
        var bd=internal.parcellation.clearCanvas(internal.context);
        if (bd[2]>0) {
            internal.overlaycontext.clearRect(bd[0],bd[1],bd[2],bd[3]);
            internal.parcellation.drawCircles(internal.context);
        } else {
            console.log('canvas too small ... skipping 2d');
            skip2d=true;
        }
        
        // First remove what's there
        if (!skip3d) {
            internal.meshes.forEach(function(m) {
                m.visible=false;
                internal.subviewers[3].scene.remove(m);
            });
        }


        var ok=1,donewithmatrices=false;

        // Hide axis lines in 3D!
        if (internal.axisline[0]!==null) {
            for (var axis=0;axis<=2;axis++)
                internal.axisline[axis].visible=false;
        }
        
        if (internal.linestack.length>0) {
            
            for (var i=0;i<internal.linestack.length;i++) {
                ok=1;
                if (!skip2d)
                    ok=drawlines(internal.linestack[i]);
                if (ok===0)
                    i=internal.linestack.length;
                else if (!skip3d)
                    drawlines3d(internal.linestack[i],true);
            }

            
            if (max>=0 ) {
                var state=internal.linestack[max];
                var mode=state.mode;
                if (mode===1) {
                    setnode(Math.round(internal.parameters.node-1));
                    donewithmatrices=true;
                }

            } else if (donewithmatrices===false) {
                setnode(Math.round(internal.parameters.node-1));
                donewithmatrices=true;
            }

            
        }

        if (internal.showlegend === true)
            drawMatricesAndLegendsAsImages();

        if (!skip3d)
            internal.layoutmanager.getrenderer().render(internal.subviewers[3].scene,
                                                        internal.subviewers[3].camera);
    };
    
    var setnode = function(node) {

        if (internal.parcellation===null)
            return;
        
        node = node || 0;
        var singlevalue=util.range(Math.round(node),0,internal.parcellation.rois.length-1);
        var intnode=Math.floor(internal.parcellation.indexmap[singlevalue]);
        internal.mni[0]= internal.parcellation.rois[intnode].x;
        internal.mni[1]= internal.parcellation.rois[intnode].y;
        internal.mni[2]= internal.parcellation.rois[intnode].z;
        internal.mni[3]= singlevalue;
        if (internal.showlegend)
            internal.parcellation.drawPoint(singlevalue,internal.overlaycontext);
        var coords = internal.mni2tal.getMMCoordinates(internal.mni);
        internal.orthoviewer.setcoordinates(coords);
        drawMatricesAndLegendsAsImages();
        if (internal.showlegend) {
            draw3dcrosshairs();
        } else {
            internal.axisline[0].visible=false;
            internal.axisline[1].visible=false;
            internal.axisline[2].visible=false;
            
        }
        updatetext();
    };

    var draw3dcrosshairs = function () {
        if (internal.axisline[0]===null)
            return;
        
        var coords = internal.mni2tal.getMMCoordinates(internal.mni);
        if (internal.mni[0]<0.0)
            coords[0]=(-coords[0]);
        else
            coords[0]=(-coords[0]-2*lobeoffset);
        coords[1]+=axisoffset[1];
        coords[2]+=axisoffset[2];
        
        internal.axisline[0].position.set(0.0,coords[1],coords[2]);
        internal.axisline[1].position.set(coords[0],0.0,coords[2]);
        internal.axisline[2].position.set(coords[0],coords[1],0.0);
        internal.axisline[0].visible=true;
        internal.axisline[1].visible=true;
        internal.axisline[2].visible=true;
    };
    
    // Update Text
    var updatetext = function() {

        if (!internal.showlegend)
            return;
        
        var ch=internal.canvas.height;
        var cw=internal.canvas.width;
        if (internal.parcellation.box[0]>=internal.parcellation.box[2] ||
            internal.parcellation.viewport.x0 >=internal.parcellation.viewport.x1)
            return;
        
        var nodenumber=internal.mni[3];

        var s_text='MNI=('+internal.mni[0]+','+internal.mni[1]+','+internal.mni[2]+')';
        var s_text2="";
        
        if (nodenumber>-1) {
            var orignode=internal.parcellation.indexmap[nodenumber];
            var humannumber=nodenumber+1;

            var lobe=gui_Lobes[internal.parcellation.rois[orignode].attr[0]];
            internal.parameters.lobe=lobe;
            
            var n=internal.parcellation.rois[orignode].attr[2];
            var network=gui_Networks[n];
            if (network===undefined) {
                network="unknown";
            } else {
                internal.parameters.network=network;
            }

            var brod=gui_BrodLabels[internal.parcellation.rois[orignode].attr[3]];
            if (brod===undefined) {
                brod="n/a";
            } 
            s_text='Node:'+humannumber+' ( '+lobe+', '+network+', '+brod+').';
            s_text2=' MNI=('+internal.mni[0]+','+internal.mni[1]+','+internal.mni[2]+')';

            if (internal.conndata.statMatrix!==null) {
                s_text2+=', (Degree: p='+internal.conndata.statMatrix[orignode][0]+', ';
                s_text2+='n='+internal.conndata.statMatrix[orignode][1]+', ';
                s_text2+='s='+internal.conndata.statMatrix[orignode][2]+') ';
            }
            s_text2+=' (sorted='+(internal.parcellation.indexmap[nodenumber]+1)+')';

            internal.parameters.node=humannumber;


            for (var ia=0;ia<internal.datgui_controllers.length;ia++) 
                internal.datgui_controllers[ia].updateDisplay();
        }

        internal.overlaycontext.save();
        internal.overlaycontext.textAlign="center";
        var x=0.5*(internal.parcellation.viewport.x0+internal.parcellation.viewport.x1)*cw;
        var wx=(internal.parcellation.viewport.x1-internal.parcellation.viewport.x0)*cw;
        var cnv = { 
            width: wx
        };
        var fnsize=webutil.getfontsize(cnv);
        var fn=fnsize+"px Arial";
        internal.overlaycontext.font=fn;
        var ymin=(internal.parcellation.box[3])+5;

        if ((ch-ymin)>3.5*fnsize) {
            internal.overlaycontext.clearRect(0,ymin,cw,ch-ymin);
            internal.overlaycontext.fillStyle="rgb(0,0,0)";
            var y=(internal.parcellation.viewport.y1)*ch;
            internal.overlaycontext.fillText(s_text,x,y-2*fnsize);
            internal.overlaycontext.fillText(s_text2,x,y-0.5*fnsize);
        }
        internal.overlaycontext.restore();
    };

    var cleanmatrixdata = function() {
        internal.conndata.cleanup();
        if (internal.keynodedlg!==null) 
            internal.keynodedlg.cleanup();
        internal.keynodedlg=null;
        internal.posFileInfo=[ "NONE", 0 ];
        internal.negFileInfo=[ "NONE", 0 ];
        internal.undostack.initialize();
        internal.linestack=[];
        update();
    };
    
    // Loads matrix. Called from input=File element 
    // @param {number} index - 0=positive,1=negative
    // @param {string} filename - file to load from
    // @param {callback} done - call this when loaded (used for sample)
    // @param {boolean} sample - if sample then no alert
    //
    var loadmatrix = function(index,filename,done,sample) {

        done= done || null;
        sample = sample || false;
        
        if (internal.parcellation===null) {
            loaderror('Load parcellation before loading connectivity matrix');
            return true;
        }

        var loaderror = function(msg) {
            webutil.createAlert(msg,true);
        };

        bisgenericio.read(filename).then( (obj) => {

            let text=obj.data;
            
            if (internal.parcellation===null) {
                loaderror('Load parcellation before loading connectivity matrix');
                return;
            }
            
            if (index===-1) {
                if (internal.conndata.posMatrix===null)
                    index=0;
                else if (internal.conndata.hasnegMatrix!==false)
                    index=0;
                else
                    index=1;
            }
            var n=internal.conndata.parsematrix(text,index,filename,loaderror);

            var np=internal.parcellation.rois.length;
            if (n>0 && n!==np) {
                loaderror('Matrix has '+n+' rows, while parcellation has '+np+' nodes. This is a problem!');
                cleanmatrixdata();
                return;
            }
            
            internal.undostack.initialize();
            internal.linestack=[];

            if (n>0) {
                if (index===0) {
                    internal.posFileInfo[0]=filename;
                    internal.posFileInfo[1] =n;
                    internal.negFileInfo[0] ="NONE";
                    internal.negFileInfo[1] =0;
                } else {
                    internal.negFileInfo[0] =filename;
                    internal.negFileInfo[1] =n;
                }

                if (done===null) {
                    internal.showlegend=true;
                    if (internal.parameters.degreethreshold>internal.conndata.maxsum)
                        internal.parameters.degreethreshold=Math.round(internal.conndata.maxsum/2);
                    internal.datgui_degreethresholdcontroller.min(0.1).max(internal.conndata.maxsum);
                    internal.datgui_degreethresholdcontroller.updateDisplay();
                    update();
                    setnode(internal.conndata.maxsumnode);
                    if (!sample) {
                        if (index===0)
                            webutil.createAlert('Positive matrix of dimensions '+np+'*'+np+' read from '+filename);
                        else
                            webutil.createAlert('Negative matrix of dimensions '+np+'*'+np+' read from '+filename);
                        window.dispatchEvent(new Event('resize'));
                    }
                } else {
                    done();
                }
                if (internal.keynodedlg!==null)
                    internal.keynodedlg.hide();
                internal.keynodedlg=null;
            }
        }).catch( (e) => { loaderror(e); });

        return false;
    };


    // Parses Parcellation
    // @param {string} text - parcellation text
    // @param {string} filename - file to load from (either .json or .txt)
    var parseparcellation = function(text,filename,silent) {
        silent = silent || false;
        internal.parcellation=new BisParcellation();
        internal.parcellation.loadrois(text,filename,bootbox.alert);
        internal.datgui_nodecontroller.min(1).max(internal.parcellation.rois.length);
        
        togglemode(false);//update();
        
        setnode(0);
        internal.undostack.initialize();
        internal.hadlinesonce=false;
        //          console.log('Going to loadmatrix');

        if (!silent) {
            webutil.createAlert('Connectivity Viewer initialized. The node definition loaded is from '+internal.parcellation.description+'.',
                                false);
            //bootbox.alert('Connectivity Viewer initialized. The node definition loaded is from '+internal.parcellation.description+'.');
        }
        internal.orthoviewer.clearobjectmap();
        cleanmatrixdata();
    };

    // Parses Brain Surface
    // @alias BisGUIConnectivityControls~parsebrainsurface from json file
    // @param {array} text - brain surfaces  to parse (as json)
    var parsebrainsurface = function(textstring,filename) {

        var meshindex=0;
        var isright=filename.lastIndexOf("right");
        if (isright>=0)
            meshindex=1;
        
        var obj= JSON.parse(textstring);
        var values=[0.8,0.9];
        
        var vertices = new Float32Array(obj.points.length);
        var indices = new Uint16Array(obj.triangles.length);
        var i;
        console.log('+++++ Brain surface loaded from '+filename+' '+[ obj.points.length,obj.triangles.length]);
        for (i=0;i<obj.points.length;i+=3) {
            vertices[i+0]=180.0-obj.points[i+0];
            if (meshindex===1)
                vertices[i]-=lobeoffset;
            else
                vertices[i]+=lobeoffset;
            vertices[i+1]=obj.points[i+1];
            vertices[i+2]=obj.points[i+2];
        }
        for (i=0;i<obj.triangles.length;i++) 
            indices[i]=obj.triangles[i];

        if (internal.brainmesh[meshindex]!==null) {
            internal.brainmesh[meshindex].visible=false;
            internal.subviewers[3].scene.remove(internal.brainmesh[meshindex]);
        }
        
        var buf=new THREE.BufferGeometry();
        buf.setIndex( new THREE.BufferAttribute( indices, 1));
        buf.addAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
        buf.computeVertexNormals();

        var material = new THREE.ShaderMaterial({
            transparent : true,
            "uniforms": {
                "diffuse": {  "type":"c","value":
                              {"r":values[meshindex],
                               "g":values[meshindex],
                               "b":values[meshindex]}},
                "opacity": {"type":"f","value":1.0}
            },
            vertexShader : brain_vertexshader_text,
            fragmentShader : brain_fragmentshader_text,
        });
        
        internal.brainmesh[meshindex] = new THREE.Mesh(buf,material);
        internal.brainmesh[meshindex].visible=true;
        internal.subviewers[3].scene.add(internal.brainmesh[meshindex]);

        if (internal.axisline[0]===null) {
            // create axis line meshes
            var p_indices = new Uint16Array(2);
            p_indices[ 0 ] = 0;   p_indices[ 1 ] = 1; 
            for (var axis=0;axis<=2;axis++) {
                var p_vertices = new Float32Array(6);
                p_vertices[0]=180.0+lobeoffset-axisoffset[0]; p_vertices[1]=-axisoffset[1]; p_vertices[2]=-axisoffset[2];
                p_vertices[3]=180.0+lobeoffset-axisoffset[0]; p_vertices[4]=-axisoffset[1]; p_vertices[5]=-axisoffset[2];
                if (axis===0) {
                    p_vertices[3]=-lobeoffset+axisoffset[0];
                } else if (axis===1) {
                    p_vertices[4]=216.0+axisoffset[1];
                } else {
                    p_vertices[5]=170.0;
                }
                var pbuf=new THREE.BufferGeometry();
                pbuf.setIndex( new THREE.BufferAttribute( p_indices, 1));
                pbuf.addAttribute( 'position', new THREE.BufferAttribute( p_vertices, 3 ) );
                internal.axisline[axis] = new THREE.Line(pbuf,
                                                         new THREE.LineBasicMaterial( {
                                                             color: 0xff8800, 
                                                             transparent: false,
                                                             opacity: 1.0,
                                                         }));
                internal.axisline[axis].visible=false;
                internal.subviewers[3].scene.add(internal.axisline[axis]);
            }
            if (internal.showlegend)
                setnode(Math.round(internal.parameters.node-1));

            window.dispatchEvent(new Event('resize'));
        }
    };
    // Loads Parcellation. 
    // @param {string} in_filename - file to load from (either .json or .txt)
    var loadparcellation = function(in_filename) {
        
        internal.parcellation=null;
        bisgenericio.read(in_filename).then( (obj) => {
            parseparcellation( obj.data,obj.filename);
        }).catch( (msg) => {
            bootbox.alert(msg);
        });
        return false;
    };



    // Reads BioImage Suite atlas file gets a description and off to callback
    // @param {callback} callback function with (atlasimage,description)
    var readatlas = function(callback) {

        var atlasimage=null;

        var myerror =  function () {
            bootbox.alert('Failed to read internal atlas file. Something is wrong here.');
            return 0;
        };
        
        var internalreadatlas = function(atlas) {
            console.log('atlas read ='+atlas.getDimensions());
            atlasimage=atlas;
            bootbox.prompt({
                title: "Please enter a description of the node definition file",
                value: "Unknown",
                callback: function(result) {
                    if (result !== null) {
                        setTimeout(function() {
                            callback(atlasimage,result);
                        },100);
                    }
                },
            });
        };
        const img=new bisweb_image();
        img.load('images/Reorder_Atlas.nii.gz',false)
            .then(function() { internalreadatlas(img); })
            .catch( (e) => { myerror(e) ; });
    };

    // Imports Parcellation Text and outputs text file in json format
    // @alias BisGUIConnectivityControls~importParcellationText
    // @param {filename} textfile - file to create node definition from
    var importParcellationText = function(textfile) {

        var loaderror = function(msg) {
            bootbox.alert(msg);
        };

        var atlasimage=null;
        var description="";
        var out="";
        var loadsuccess = function(textstring,filename) {
            console.log('++++ textstring of length='+textstring.length+' read from'+filename);
            try { 
                out=new BisParcellation().createParcellationFromText(textstring,filename,atlasimage,description)+"\n";
            } catch(e) {
                bootbox.alert(e);
                return;
            }
            parseparcellation(out,filename+".parc",true);
            bisgenericio.write({
                filename : filename+".parc",
                title : 'File to save node definition in',
                filters : [ { name: 'JSON formatted Node definition file', extensions: [ 'parc']}],
            },out);
        };


        bisgenericio.read(textfile).then( (obj) => {

            let textstring=obj.data;
            let filename=obj.filename;

            var loadsuccess1 =function(atlas,result) {
                atlasimage=atlas;
                description=result;
                loadsuccess(textstring,filename);
            };
            
            try { 
                util.parseMatrix(textstring,filename,false,3);
            } catch(e) {
                bootbox.alert('Failed to parse file '+filename+' it does not have 3 columns or something else is wrong. ('+e+')');
                return;
            }
            
            readatlas(loadsuccess1);
        }).catch( (e) => {
            loaderror(e);
        });
    };




    // Imports Parcellation Image and outputs text file in json format
    // @param {BisWebImage} image - image to create from
    var importParcellationImage = function(vol) {
        
        
        var createparcellationfromimage = function(atlasimage,description) {
            
            var fname=vol.getFilename();
            var index=fname.lastIndexOf(".nii.gz");
            if (index>0)
                fname=fname.slice(0,index)+".parc";
            var out="";
            try { 
                out=new BisParcellation().createParcellationFromImage(vol,atlasimage,description)+"\n";
            } catch(e) {
                bootbox.alert(e);
                return;
            }
            parseparcellation(out,fname,true);
            internal.orthoviewer.setobjectmap(vol,true);
            bisgenericio.write({
                filename : fname,
                title : 'File to save node definition in',
                filters : [ { name: 'JSON formatted Node definition file', extensions: [ 'parc']}],
            },out);
        };

        var d=vol.getDimensions();
        var s=vol.getSpacing();
        var truedim = [  181,217,181,1 ] ;
        var truespa = [  1.0,1.0,1.0,1.0 ];
        d[3]=truedim[3];
        s[3]=truespa[3];

        console.log('\n\n\n\n\n'+numeric.sub(d,truedim));
        var diff=numeric.norminf(numeric.sub(d,truedim));

        console.log(numeric.sub(s,truespa));
        var diff2=numeric.norminf(numeric.sub(s,truespa));
        var orient=vol.getOrientation().name;
        
        console.log([diff,diff2]);
        if (diff>0 || diff2>0.01 || orient!=="RAS") {
            bootbox.alert("Bad Parcellation Image for creating a Parcellation file."+
                          "Must be RAS 181x217x181 and 1x1x1 mm (i.e. MNI 1mm space)."+
                          "This image has orientation "+orient+", dimensions="+[d[0],d[1],d[2]]+
                          " voxel size="+
                          [ util.scaledround(s[0],10),util.scaledround(s[1],10),
                            util.scaledround(s[2],10) ]);
            return 0;
        }

        readatlas(createparcellationfromimage);
    };

    // -------------------------------------------------------------------------------------------
    // create GUI
    // -------------------------------------------------------------------------------------------

    // actual GUI creation when main class is ready
    // The parent element is internal.parentDomElement
    var onDemandCreateGUI = function () {
        
        if (internal.parentDomElement===null)
            return;
        
        internal.parentDomElement.empty();
        var basediv=webutil.creatediv({ parent : internal.parentDomElement});
        internal.domElement=basediv;

        var data = internal.parameters;
        data.this=this;
        internal.datgui = new dat.GUI({autoPlace: false});
        
        var gui=internal.datgui;
        basediv.append(gui.domElement);
        
        var coords = gui.addFolder('Core');
        coords.open();
        var disp = gui.addFolder('Display');
        var clist = [];
        coords.add(data,'mode',gui_Modes).name("Mode");
        var a1=coords.add(data,'node',1,400).name("Node");
        clist.push(a1);
        a1.onChange(function(val) {
            setnode(Math.round(val-1));
        });
        internal.datgui_nodecontroller=a1;
        
        clist.push(coords.add(data,'lobe',gui_Lobes_Values).name("Lobe"));
        clist.push(coords.add(data,'network',gui_Networks_Values).name("Network"));
        internal.datgui_degreethresholdcontroller=coords.add(data,'degreethreshold',1,100).name("Degree Thrshld");
        clist.push(internal.datgui_degreethresholdcontroller);
        clist.push(coords.add(data,'linestodraw',gui_Lines).name("Lines to Draw"));
        
        clist.push(disp.add(data,'length',10,100).name("Length"));
        clist.push(disp.add(data,'thickness',1,4).name("Thickness"));
        clist.push(disp.add(data,'radius',0.2,4.0).name("Radius (3D)"));
        clist.push(disp.addColor(data, 'poscolor').name("Pos-Color"));
        clist.push(disp.addColor(data, 'negcolor').name("Neg-Color"));


        internal.datgui_controllers=clist;
        
        webutil.removedatclose(gui);
        
        var ldiv0=$("<H4> </H4>").css({ 'margin':'5px'});   basediv.append(ldiv0);

        var bbar1=webutil.createbuttonbar({ parent : basediv});

        webutil.createbutton({ type : "default",
                               name : "Toggle Legends",
                               position : "top",
                               tooltip : "Show/Hide auxiliary information",
                               parent : bbar1,
                               callback : toggleshowlegend,
                             });
        

        webutil.createbutton({ type : "default",
                               name : "Toggle 3D Mode",
                               position : "top",
                               css : { "margin-left": "5px"},
                               tooltip : "Click this to switch display mode from circle+3D to circle to 3D",
                               parent : bbar1,
                               callback : togglemode,
                             });


        var ldiv2=$("<H4> </H4>").css({ 'margin':'5px'});   basediv.append(ldiv2);
        var bbar2=webutil.createbuttonbar({ parent : basediv});

        webutil.createbutton({ type : "info",
                               name : "Create Lines",
                               position : "bottom",
                               css : { "margin": "5px"},
                               tooltip : "Click this to create lines",
                               parent : bbar2,
                               callback : createlines,
                             });

        webutil.createbutton({ type : "default",
                               name : "Clear Lines",
                               position : "bottom",
                               css : { "margin": "5px"},
                               tooltip : "Click this to clear the lines",
                               parent : bbar2,
                               callback : removelines,
                             });



        webutil.tooltip(internal.parentDomElement);


        // ------------------------------------------------
        // On to interesting dialog
        // ------------------------------------------------
    };

    var createlines = function() {

        if (internal.conndata.statMatrix===null) {
            bootbox.alert('No connectivity data loaded');
            return;
        }


        var getKeyByValue = function( obj,value,base ) {
            for( var prop in obj ) {
                if( obj.hasOwnProperty( prop ) ) {
                    if( obj[prop ] === value )
                        return prop;
                }
            }
            return base;
        };
        internal.lastopisclear = false;
        //          internal.parcellation.drawCircles(internal.context);
        
        
        
        var mode=2;
        if (internal.parameters.mode===gui_Modes[0]) // All
            mode=0;
        if (internal.parameters.mode==gui_Modes[1]) // Single Node
            mode=1;

        var singlevalue=-1,attribcomponent=0;
        if (mode === 1) {
            singlevalue=Math.round(internal.parameters.node)-1;
            //          console.log('GUI Input singlevalue='+singlevalue+' HUMAN = '+(singlevalue+1));
        } else if (mode===2 ) {
            if (internal.parameters.mode===gui_Modes[2]) { // Lobe
                attribcomponent=0;
                singlevalue=getKeyByValue(gui_Lobes,internal.parameters.lobe,1);
            } else {
                attribcomponent=2;
                singlevalue=getKeyByValue(gui_Networks,internal.parameters.network,1);
            }
        }

        var degreethreshold=Math.round(internal.parameters.degreethreshold);
        var matrixthreshold=internal.parameters.matrixthreshold;
        var filter=2;
        

        var state = { mode: mode,
                      guimode : internal.parameters.mode,
                      node : internal.parameters.node,
                      lobe : internal.parameters.lobe,
                      network : internal.parameters.network,
                      degreethreshold : degreethreshold,
                      poscolor : internal.parameters.poscolor,
                      negcolor : internal.parameters.negcolor,
                      length : internal.parameters.length,
                      thickness: internal.parameters.thickness,
                      linestodraw : internal.parameters.linestodraw,
                      singlevalue: singlevalue,
                      attribcomponent : attribcomponent,
                      filter: filter,
                      radius : internal.parameters.radius,
                      matrixthreshold : matrixthreshold};

        if (internal.hadlinesonce)
            addStateToUndo();
        internal.hadlinesonce=true;
        internal.linestack.push(state);
        update();
    };
    
    var drawlines=function(state) {

        var ok=internal.conndata.createFlagMatrix(internal.parcellation,
                                                  state.mode, // mode
                                                  state.singlevalue, // singlevalue
                                                  state.attribcomponent, // attribcomponent
                                                  state.degreethreshold, // metric threshold
                                                  state.filter); // sum

        if (ok===0) {
            bootbox.alert('Failed to create flag matrix for connectivity data!');
            return 0;
        }
        

        var total=0;
        
        if (state.linestodraw == gui_Lines[0] ||
            state.linestodraw == gui_Lines[2] ) {
            var pos=internal.conndata.createLinePairs(0,state.matrixthreshold);
            //console.log('\n\n +++ Created '+pos.length+' positive linepairs\n'+JSON.stringify(pos));
            total+=pos.length;
            internal.conndata.drawLines(internal.parcellation,pos,
                                        state.poscolor,
                                        internal.context,
                                        state.length*internal.parcellation.scalefactor,
                                        state.thickness);
        }
        if (state.linestodraw == gui_Lines[1] ||
            state.linestodraw == gui_Lines[2] ) {

            var neg=internal.conndata.createLinePairs(1,state.matrixthreshold);
            //          console.log('+++ Created '+neg.length+' negagive linepairs\n'+JSON.stringify(neg)+'\n');
            total+=neg.length;
            internal.conndata.drawLines(internal.parcellation,neg,
                                        state.negcolor,
                                        internal.context,
                                        state.length*internal.parcellation.scalefactor,
                                        state.thickness);
        }

        if (total===0)
            return -1;
        return total;
    };
    

    var removelines = function() {
        if (internal.conndata.statMatrix===null) {
            bootbox.alert('No connectivity data loaded');
            return;
        }

        addStateToUndo();
        internal.linestack = [];
        update();
    };


    
    var drawlines3d=function(state,doNotUpdateFlagMatrix) {     


        doNotUpdateFlagMatrix=doNotUpdateFlagMatrix || false;
        if (internal.parcellations=== null ||
            internal.subviewers === null)
            return 0;
        

        if (!doNotUpdateFlagMatrix) {
            console.log('Updating Flag Matrix\n');
            var ok=internal.conndata.createFlagMatrix(internal.parcellation,
                                                      state.mode, // mode
                                                      state.singlevalue, // singlevalue
                                                      state.attribcomponent, // attribcomponent
                                                      state.degreethreshold, // metric threshold
                                                      state.filter); // sum
            
            if (ok===0) {
                bootbox.alert('Failed to create flag matrix for 3D connectivity data!');
                return 0;
            }
        }
        


        // Now add lines
        var pos=[],neg=[],total=0;
        if (state.linestodraw == gui_Lines[0] ||
            state.linestodraw == gui_Lines[2] ) {
            pos=internal.conndata.createLinePairs(0,state.matrixthreshold);
            total+=pos.length;
        }
        if (state.linestodraw == gui_Lines[1] ||
            state.linestodraw == gui_Lines[2] ) {

            neg=internal.conndata.createLinePairs(1,state.matrixthreshold);
            total+=neg.length;
        }
        if (total===0)
            return 0;

        
        var color = [ internal.parameters.poscolor, 
                      internal.parameters.negcolor,
                      internal.parameters.poscolor,
                      internal.parameters.negcolor  ];
        
        var lparr = internal.conndata.draw3DLines(internal.parcellation,pos,neg);
        for (var i=0;i<=1;i++) {
            var lp=lparr[i];
            if (lp.indices!==null) {
                var buf=new THREE.BufferGeometry();
                buf.setIndex(  new THREE.BufferAttribute( lp.indices, 1 ) );
                buf.addAttribute( 'position', new THREE.BufferAttribute( lp.vertices, 3 ) );
                var linemesh = new THREE.LineSegments(buf,
                                                      new THREE.LineBasicMaterial( {
                                                          color: color[i],
                                                          linewidth : 1,
                                                          linecap : "square",
                                                      }));
                linemesh.visbile=true;
                internal.subviewers[3].scene.add(linemesh);
                internal.meshes.push(linemesh);
            }
        }

        var sphere = new THREE.SphereGeometry(state.radius,16,16);
        var presphere = bisCrossHair.createpregeometry([sphere]);

        for (var j=2;j<=5;j++) {
            var sph=lparr[j];
            var scale=255.0;
            if (sph.positions.length>0) {
                var cl=util.hexToRgb(color[j-2]);
                if (j>3)
                    scale=500.0;
                //                  console.log('Spheres '+j+' length='+sph.positions.length+' color='+[ cl.r,cl.g,cl.b]+' scale='+scale);

                var spherematerial = new THREE.ShaderMaterial({
                    transparent : true,
                    "uniforms": {
                        "diffuse": {  "type":"c","value":
                                      {"r":cl.r/scale,
                                       "g":cl.g/scale,
                                       "b":cl.b/scale}},
                        "opacity": {"type":"f","value":0.5},
                    },
                    vertexShader : sphere_vertexshader_text,
                    fragmentShader : sphere_fragmentshader_text,
                });
                var geom=bisCrossHair.createcopies(presphere,sph.positions,sph.scales);
                geom.computeVertexNormals();
                var spheremesh=new THREE.Mesh(geom,spherematerial);
                spheremesh.visbile=true;
                internal.subviewers[3].scene.add(spheremesh);
                internal.meshes.push(spheremesh);
            }
        }
        
        
        return total;
    };
    
    // -------------------------------------------------------------------------------------------
    // Public Interface from here on
    // -------------------------------------------------------------------------------------------
    var control= {
        
        // initialize (or reinitialize landmark control). Called from viewer when image changes. This actually creates (or recreates the GUI) as well.(This implements a function from the {@link BisMouseObserver} interface.)
        // @memberof BisGUIConnectivityControl.prototype
        // @param {Bis_SubViewer} subviewers - subviewers to place info in
        // @param {BisWebImage} volume - new image
        initialize : function(subviewers,volume) {

            volume = volume || null; // Just to eliminate the warning as we don't use this
            internal.subviewers=subviewers;
            onDemandCreateGUI();
            loadparcellation('images/shen.json');
            
            bisgenericio.read('images/lobes_right.json').then( (obj) => {
                parsebrainsurface(obj.data,obj.filename);
            }).catch( (e) => { console.log(e); });
            
            bisgenericio.read('images/lobes_left.json').then( (obj) => {
                parsebrainsurface(obj.data,obj.filename);
            }).catch( (e) => { console.log(e); });
                              
            update(false);
            setTimeout(function() {
                window.dispatchEvent(new Event('resize'));
            },10);
        },


        // Loads a parcellation from fname (json or txt)
        // @memberof BisGUIConnectivityControl.prototype
        loadparcellationfile : function(fname) {
            console.log('Loading from'+fname);
            loadparcellation(fname);
        },
        

        // receive mousecoordinates and act appropriately!
        // (This implements a function from the {@link BisMouseObserver} interface.)
        // @memberof BisGUIConnectivityControl.prototype
        // @param {array} mm - [ x,y,z ] array with current point
        // @param {number} plane - 0,1,2 to signify whether click was on YZ,XZ or XY image plane (-1,3 mean 3D click)
        // @param {number} mousestate - 0=click 1=move 2=release
        //
        updatemousecoordinates : function (mm,plane,mousestate) {
            if (mousestate<0 || mousestate === undefined || mousestate===2)
                return;

            internal.mni=internal.mni2tal.getMNICoordinates(mm);
            internal.mni[3]=-1;
            if (internal.mni===null)
                return;
            
            if (internal.parcellation!==null) {
                internal.mni[3]=internal.parcellation.findMNIPoint(internal.mni[0],internal.mni[1],internal.mni[2],
                                                                   internal.overlaycontext);
            } 

            draw3dcrosshairs();
            updatetext();
        },
        
        // receive window resize events and redraw 
        // (This implements a function from the {@link BisResizeObserver} interface.)
        // @memberof BisGUIConnectivityControl.prototype
        handleresize : function() {
            update(false);
            if (internal.showlegend)
                setnode(Math.round(internal.parameters.node-1));

        },

        loadmatrix : function(index,fname) {
            return loadmatrix(index,fname);
        },


        loadsamplematrices : function(filenames) {

            var loadnext = function() {
                loadmatrix(1,filenames[1],null,true);
                webutil.createAlert('Sample connectivity matrices loaded.');
                window.dispatchEvent(new Event('resize'));
            };
            loadmatrix(0,filenames[0],loadnext,true);

        },

        info : function() {
            var s="Using node definitions from "+internal.parcellation.description+" with "+internal.parcellation.rois.length+" regions. <BR>";
            s+='Positive matrix info = ('+internal.posFileInfo+'). <BR>';
            s+='Negative matrix info = ('+internal.negFileInfo+'). <BR>';
            s+='The Broadmann areas use the BioImage Suite internal definition.<BR>The Networks are as defined in Power et al. Neuron 2011.';
            webutil.createAlert(s);
        },

        handleMouseEvent : function(e) {

            if (internal.parcellation===null)
                return;
            var point=internal.parcellation.findPoint(e.offsetX,e.offsetY,internal.overlaycontext);
            if (point==-1) {
                return;
            }
            setnode(point);
        },

        handleKeyEvent : function(event) {
            var key=event.keyCode;
            var offset=0;
            if (key===80)
                offset=-1;
            else if (key===78)
                offset=+1;
            if (offset===0)
                return;

            var domap=(event.shiftKey);

            var nodenumber=Math.round(internal.parameters.node)-1 || 0;
            var maxnode= internal.parcellation.rois.length-1;
            var intnode;

            if (domap) {
                intnode=internal.parcellation.indexmap[nodenumber]+offset;
            } else {
                intnode=nodenumber+offset;
            }

            if (intnode<0)
                intnode=maxnode;
            else if (intnode>maxnode)
                intnode=0;
            
            var newnode=0;
            if (domap) {
                newnode=internal.parcellation.rois[intnode].index;
            } else {
                newnode=intnode;
            }
            setnode(newnode);
        },

        clearmatrices : function() {
            cleanmatrixdata();
        },

        undo : function() {
            getStateFromUndoOrRedo(false);
        },

        redo : function() {
            getStateFromUndoOrRedo(true);
        },

        resetdefault : function() {
            internal.parameters.length = 50;
            internal.parameters.thickness=2;
            internal.parameters.radius=1.0;
            internal.parameters.poscolor= "#ff0000";
            internal.parameters.negcolor= "#00dddd";
            for (var ia=0;ia<internal.datgui_controllers.length;ia++) 
                internal.datgui_controllers[ia].updateDisplay();
        },
        
        downloadAsCSV : function() {
            if (internal.conndata.flagMatrix===null) {
            }
        },

        showmatrices : function() {
            drawMatricesInWindow();
        },

        about : function() {

            webutil.aboutDialog(' If you use this for a publication please cite Finn et. al Nature Neuro 2015.');
        },

        importparcellation : function(image) {
            importParcellationImage(image);
        },

        importparcellationtext : function(filename) {
            importParcellationText(filename);
        },

        
        viewInteresting : function() {

            if (internal.conndata.statMatrix===null) {
                bootbox.alert('No connectivity data loaded');
                return;
            }

            if (internal.keynodedlg!==null) {
                //                  console.log('Calling show on '+internal.keynodedlg);
                internal.keynodedlg.show();
                return;
            }
            
            
            var c_data=internal.conndata.getSortedNodesByDegree(2);
            var numnodes=c_data.length-1;
            var maxnodes=Math.round(0.1*numnodes);

            var ch=internal.context.canvas.height;
            var cw=internal.context.canvas.width;
            var vp=internal.parcellation.viewport;
            var width  = 0.7*cw;
            if (width>500)
                width=500;
            var height = 600;
            console.log('vp='+[vp.x0,vp.x1,vp.y0,vp.y1]+' w*h'+[cw,ch]);
            var showdialog=webutil.createdialog("Top "+maxnodes+" Nodes (sorted by degree)",width,height,cw+300-width,100 );

            var widget=showdialog.widget;
            var templates=webutil.getTemplates();
            var newid=webutil.createWithTemplate(templates.bisscrolltable,
                                                 widget);
            var stable=$('#'+newid);
            var t1 = $(".bistscroll",stable);

            var dim=showdialog.getdimensions();
            var hgt=dim.height-2*dim.titleHeight;
            $(t1).css({
                height: hgt+"px",
            });
            console.log('dimensions='+JSON.stringify(dim)+' hgt='+hgt);
            
            var buttonnodepairs = [];
            var callback = function(e) {
                var id=e.target.id;
                var node=buttonnodepairs[id];
                internal.parameters.mode="Single Node";
                setnode(node);
            };

            var thead = $(".bisthead",stable);
            var tbody = $(".bistbody",stable);
            thead.empty();
            tbody.empty();
            tbody.css({'font-size':'12px',
                       'user-select': 'none'});
            thead.css({'font-size':'12px',
                       'user-select': 'none'});
            
            var hd=$('<tr>'+
                     ' <td width="5%">#</th>'+
                     ' <td width="15%">Node</th>'+
                     ' <td width="70%">Details</th>'+
                     ' <td width="10%"></th>'+
                     '</tr>');
            thead.append(hd);
            thead.css({ font: "Arial 12px"});


            for (var i=0;i<maxnodes;i++) {

                var node=c_data[numnodes-i].node;
                var degree=c_data[numnodes-i].degree;
                if (degree>0) {
                    var c = [ internal.parcellation.rois[node].x,
                              internal.parcellation.rois[node].y,
                              internal.parcellation.rois[node].z];
                    
                    var s0= i+1+".";
                    var s1= node+1;
                    var lobe=gui_Lobes[internal.parcellation.rois[node].attr[0]];
                    
                    var s2= 'degree='+degree+'\t(MNI='+c+', Lobe='+lobe+')';
                    var nid=webutil.getuniqueid();
                    
                    var w=$('<tr>'+
                            ' <td width="5%">'+s0+'</th>'+
                            ' <td width="15%">'+s1+'</th>'+
                            ' <td width="70%">'+s2+'</th>'+
                            ' <td width="10%"><button type="button" class="btn-info btn-sm" style="padding: 2px, font-size: 10px"'+
                            ' id="'+nid+'">Go</button></th>'+
                            '</tr>');
                    tbody.append(w);
                    var btn=$('#'+nid);
                    btn.click(callback);
                    buttonnodepairs[nid]=(node);
                }
            }
            showdialog.show();
            internal.keynodedlg=showdialog;
        },
        
    };

    internal.this=control;
    internal.parentDomElement=parent;
    var basediv=$("<div>To appear...</div>");
    internal.parentDomElement.append(basediv);
    internal.orthoviewer=orthoviewer;
    internal.orthoviewer.addMouseObserver(internal.this);
    internal.orthoviewer.addResizeObserver(internal.this);

    internal.canvas=internal.layoutmanager.getcanvas();
    internal.context=internal.canvas.getContext("2d");
    internal.mni2tal=bismni2tal();

    internal.overlaycanvas = internal.layoutmanager.getoverlaycanvas();
    internal.overlaycontext=internal.overlaycanvas.getContext("2d");

    // Why this needs to be bound to renderer beats me ...
    var w=internal.layoutmanager.getrenderer().domElement;
    w.addEventListener('mousedown',function(fe) {
        internal.this.handleMouseEvent(fe);});

    window.addEventListener('keydown',function(fe) {
        internal.this.handleKeyEvent(fe);
    },true);

    
    return control;
};

/** 
 * A web element to create and manage a GUI for a Connectivity Display Tool (brain connectivity matrix visualizations.)
 *  The GUI for this appears inside a {@link ViewerLayoutElement}.
 * A manager element gets a pointer to this and calls the createMenu function to add
 *    load/save objectmap to a menu
 *
 * @example
 * <bisweb-connectivitycontrolelement
 *   id="conncontrol"
 *   bis-layoutwidgetid="#viewer_layout"
 *   bis-viewerid="#viewer">
 * </bisweb-connectivitycontrolelement>
 *
 * Attributes:
 *      bis-viewerid : the orthogonal viewer to draw in 
 *      bis-layoutwidgetid :  the layout widget to create the GUI in
 */

class ConnectivityControl extends HTMLElement {

    connectedCallback() {
        
        let viewerid=this.getAttribute('bis-viewerid');
        let layoutid=this.getAttribute('bis-layoutwidgetid');
        let viewer=document.querySelector(viewerid);
        let layoutcontroller=document.querySelector(layoutid);
        let basegui=layoutcontroller.createToolWidget('Connectivity Control',true);

        this.innercontrol=bisGUIConnectivityControl(basegui,viewer,layoutcontroller);
    }

    /** load parcellation file 
     * @param {string} fname - the url or filename or file object or an electron object with members 
     */
    loadparcellationfile(fname) { this.innercontrol.loadparcellationfile(fname); }
    
    /** loads a a matrix file 
     * @param {string} fname - the url or filename or file object or an electron object with members 
     */
    loadmatrix(index,fname) { this.innercontrol.loadmatrix(index,fname); }

    /** Loads sample matrices
     * @param {array} fnames - an array of (the url or filename or file object or an electron object with members)
     */
    loadsamplematrices(fnames) { this.innercontrol.loadsamplematrices(fnames);  }

    /** clears matrices */
    clearmatrices() { this.innercontrol.clearmatrices(); }

    /* undo last draw operations */
    undo() { this.innercontrol.undo(); }

    /* redo last draw operations */
    redo() { this.innercontrol.redo(); }

    /* prints info about current data */
    info() { this.innercontrol.info(); }

    /* shows a popup dialog listing the most "interesting" nodes */
    viewInteresting() { this.innercontrol.viewInteresting(); }

    /* displays the matrices */
    showmatrices() { this.innercontrol.showmatrices(); }
    
    /** Imports a parcellation as text file 
     * @param {array} fnames - an array of (the url or filename or file object or an electron object with members)
     */
    importparcellationtext(f) { this.innercontrol.importparcellationtext(f); }

    /** Imports a parcellation as json file 
     * @param {array} fnames - an array of (the url or filename or file object or an electron object with members)
     */
    importparcellation(f) { this.innercontrol.importparcellation(f); }

    /** popups a dialog showing info about this control */
    about() { this.innercontrol.about(); }
}

webutil.defineElement('bisweb-connectivitycontrolelement', ConnectivityControl);


