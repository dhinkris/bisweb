#!/usr/bin/env node

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



// -----------------------------------------------------------------
// Header and requirements for node.js
'use strict';

// -----------------------------------------------------------------
// Create command line
// -----------------------------------------------------------------

require('../../config/bisweb_pathconfig.js');
const program=require('commander');
const BisWebImage=require('bisweb_image');

      
var help = function() {
    console.log('\nThis program prints the header for a set of images');
};

program.version('1.0.0')
    .option('-i, --input <s>','filename of the file to print header for')
    .on('--help',function() {
	help();
    })
    .parse(process.argv);


let inpfilename=program.input || null;

if (inpfilename===null) {
    console.log('No input filename specified');
    process.exit(1);
}

let slist=[ inpfilename ].concat(program.args);

let img=new Array(slist.length);
let p=[];

for (let i=0;i<slist.length;i++) {
    img[i]=new BisWebImage();
    p.push(img[i].load(slist[i],"None"));
}

Promise.all(p).then( () => {
    for (let i=0;i<slist.length;i++) {
	console.log('----------------------------------------------------');
	console.log('\n', img[i].getDescription(),'\n');
	console.log(img[i].getHeader().getDescription());
    }
    console.log('----------------------------------------------------');
}).catch( (e) => {
    console.log(e.stack);
    process.exit(1);
});




