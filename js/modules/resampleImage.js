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

'use strict';

const biswrap = require('libbiswasm_wrapper');
const BaseModule = require('basemodule.js');
const baseutils=require("baseutils");

// Image1 + Image2 + Transformation -> Output
// Reslices Image2 using Transformation to make an image that looks like Image1
//
// Resample
// ImageToImage .. change resolution
/**
 * Resamples a given image to use a new set of voxel spacings. Can specify how voxels should be interpolated, either nearest-neighbor,
 * linear interpolation, or cubic interpolation.
 */
class ResampleImageModule extends BaseModule {
    constructor() {
        super();
        this.name = 'resampleImage';
    }


    createDescription() {
        return {
            "name": "Resample Image",
            "description": "Resamples an existing image",
            "author": "Zach Saltzman",
            "version": "1.0",
            "inputs": baseutils.getImageToImageInputs(),
            "outputs": baseutils.getImageToImageOutputs(),
            "buttonName": "Resample",
            "shortname" : "rsp",
            "params": [
                {
                    "name": "XSpacing",
                    "description": "Desired voxel spacing in X direction",
                    "priority": 1,
                    "advanced": false,
                    "gui": "slider",
                    "type": "float",
                    "varname": "xsp",
                    "default" : -1.0,
                },
                {
                    "name": "Y Spacing", 
                    "description": "Desired voxel spacing in Y direction",
                    "priority": 2,
                    "advanced": false,
                    "gui": "slider",
                    "type": "float",
                    "varname": "ysp",
                    "default" : -1.0,
                },
                {
                    "name": "Z Spacing", 
                    "description": "Desired voxel spacing in Z direction",
                    "priority": 3,
                    "advanced": false,
                    "gui": "slider",
                    "type": "float",
                    "varname": "zsp",
                    "default" : -1.0,
                },
                {
                    "name": "Interpolation",
                    "description": "Type of interpolation to use (0 = nearest-neighbor, 1 = linear, 3 = cubic)",
                    "priority": 4,
                    "advanced": false,
                    "gui": "dropdown",
                    "type": "int",
                    "varname": "interpolation",
                    "fields": [ 0,1,3 ],
                    "restrictAnswer": [ 0,1,3],
                    "default" : 1,
                },
                {
                    "name": "Background Value", 
                    "description": "value to use for outside the image",
                    "priority": 100,
                    "advanced": true,
                    "gui": "entrywidget",
                    "type": "float",
                    "varname": "backgroundvalue",
                    "default" : 0.0,
                },
                baseutils.getDebugParam()
            ]
        };
    }


    directInvokeAlgorithm(vals) {
        console.log('oooo invoking: resampleImage with vals', JSON.stringify(vals));
        return new Promise((resolve, reject) => {
            let input = this.inputs['input'];
            biswrap.initialize().then(() => {
                this.outputs['output'] = biswrap.resampleImageWASM(input, {
                    "spacing" : [parseFloat(vals.xsp), parseFloat(vals.ysp), parseFloat(vals.zsp)],
                    "interpolation" : parseInt(vals.interpolation),
                    "backgroundValue" : parseFloat(vals.backgroundvalue)
                },vals.debug);

                resolve();
            }).catch( (e) => {
                reject(e.stack);
            });
        });
    }

    updateOnChangedInput(inputs,controllers=null,guiVars=null) {

        let newDes = this.getDescription();
        inputs = inputs || this.inputs;
        let current_input = inputs['input'] || null;
        if (current_input===null)
            return newDes;

        let nm = [ 'xsp','ysp','zsp' ];
        
        let spa = current_input.getSpacing();

        for (let i = 0; i < newDes.params.length; i++) {
            let name = newDes.params[i].varname;
            let index=nm.indexOf(name);
            if (index>=0) {
                newDes.params[i].low = spa[index]*0.33;
                newDes.params[i].high = spa[index]*3.0;
                newDes.params[i].default = spa[index];
                let st= 0.1;
                
                while (st>0.1*spa[index])
                    st=0.1*st;
                newDes.params[i].step=st;
                if (controllers!==null)
                    this.updateSingleGUIElement(newDes.params[i],controllers[name],guiVars,name);
                
            }
        }
        return newDes;
    }

    
}

module.exports = ResampleImageModule;
