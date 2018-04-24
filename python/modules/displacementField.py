#!/usr/bin/env python3

# LICENSE
# 
# _This file is Copyright 2018 by the Image Processing and Analysis Group (BioImage Suite Team). Dept. of Radiology & Biomedical Imaging, Yale School of Medicine._
# 
# BioImage Suite Web is licensed under the Apache License, Version 2.0 (the "License");
# 
# - you may not use this software except in compliance with the License.
# - You may obtain a copy of the License at [http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0)
# 
# __Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.__
# 
# ENDLICENSE



import bis_path
import sys
import math
import numpy as np
import argparse
import bis_basemodule
import bis_objects
import modules_desc
import biswrapper as libbis;

class displacementField(bis_basemodule.baseModule):

    def __init__(self):
        super().__init__();
        self.name='displacementField';
   
    def createDescription(self):
        return modules_desc.descriptions['displacementField'];

    def directInvokeAlgorithm(self,vals):
        print('oooo invoking: displacementField', (vals));
	
        image = self.inputs['input'];
        dimension = image.dimensions;
        spacing = image.spacing;


        self.outputs['output'] = libbis.computeDisplacementFieldWASM(self.inputs['transform'], {
            "dimensions" : [ dimension[0], dimension[1], dimension[2] ],
            "spacing" : [ spacing[0], spacing[1], spacing[2] ]
        }, self.parseBoolean(vals['debug']));
        try:
            print(self.outputs['output'].dimensions);
        except:
            print('---- Failed to invoke algorithm');
            return False

        return True

if __name__ == '__main__':
    import bis_commandline; sys.exit(bis_commandline.loadParse(displacementField(),sys.argv,False));
    
