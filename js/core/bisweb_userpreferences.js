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

"use strict";
const genericio = require('bis_genericio');

/**
 * biswebUserPreferences namespace. Utility code to read/write user preferences
 * @namespace biswebUserPreferences
 */

/** 
 * The last good pointer to the web database
 * @alias biswebUserPreferences.dbasepointer
 */
let dbasepointer=null;

/** 
 * The internal user preferences Object
 * @alias biswebUserPreferences.userPreferences
 */

const userPreferences = {
    orientationOnLoad : 'None',
    snapshotscale : 2,
    snapshotdowhite : true
};

/** 
 * Given a string returns one of 'RAS', 'LPS' or 'None'
 * true maps to RAS, all else to 'None'
 * @alias biswebUserPreferences.santizeOrientationOnLoad
 * @param {String} name - the input orientation name
 * @returns {String} - the output orientation name
 */

let sanitizeOrientationOnLoad=function(name) {

    if (name==='Auto')
        return userPreferences['orientationOnLoad'];
    
    if (['RAS','LPS','None'].indexOf(name)>=0)
        return name;

    if (name === undefined || name === null)
        return userPreferences['orientationOnLoad'];
    
    if (name===true)
        return 'RAS';
    
    return "None";
};


/** 
 * Sets the orientation to a given name. Calls sanitizeOrientationOnLoad to clean this up first
 * @alias biswebUserPreferences.setImageOrientationOnLoad
 * @param {String} name - the input orientation name
 * @param {String} comment - an optional string for console.log logging output
 */
let setImageOrientationOnLoad=function(name='',comment='') {

    userPreferences['orientationOnLoad']=sanitizeOrientationOnLoad(name);
    if (comment!==null)
        console.log(',,,, Setting forcing orientationOnLoad to: '+userPreferences['orientationOnLoad']+' (from '+name+'), '+comment);
};

/** 
 * Returns the  ImageOrientationOnLoad setting
 * @alias biswebUserPreferences.getImageOrientationOnLoad
 * @returns {String} - the current force orientation on load
 */
let getImageOrientationOnLoad=function() {
    return userPreferences['orientationOnLoad'];
};


/** 
 * @alias biswebUserPreferences.getDefaultFileName
 * @returns {String} -  Returns HOMEDIR/.bisweb if on node or null if in browser 
 */
let getDefaultFileName=function() {
    
    if (genericio.getmode() === 'browser') 
        return null;

    
    const os = genericio.getosmodule();
    const path = genericio.getpathmodule();
    let homedir=os.homedir();
    return path.join(homedir,'.bisweb');
};


/** 
 * Parses the user preferences from a JSON string
 * @alias biswebUserPreferences.parseUserPreferences
 * @param {String} dat - the json string to parse from
 * @returns {Boolean} - true if successful
 */
let parseUserPreferences=function(obj) {

    Object.keys(obj).forEach((key) => {
        userPreferences[key]=obj[key];
    });
    // Make sure this is sane

    if (!userPreferences['orientationOnLoad'])
        userPreferences['orientationOnLoad']='None';
    else
        setImageOrientationOnLoad(userPreferences['orientationOnLoad'],'None');
    
    return true;
};

/** 
 * Loads the user preferences from a file object or ${HOME}/.bisweb
 * @alias biswebUserPreferences.load
 * @param {String} filename - the current filename or ${HOME}/.bisweb
 * @returns {String} - filename that these were read from or null
 */
let nodeLoadUserPreferences=function(fname=null) {

    if (genericio.getmode() === 'browser')  {
        return null;
    }

    if (fname===null)
        fname=getDefaultFileName();
    
    const fs = genericio.getfsmodule();
    let d1 = "";
    try {
        d1=fs.readFileSync(fname, 'utf-8');
    } catch(e) {
        return null;
    }

    let p=null;
    try {
        p=JSON.parse(d1);
    } catch(e) {
        return null;
    }

    if (p.bisformat !==  "BisWebUserPreferences") {
        console.log('---- Bad JSON Magic Code (bisformat) in ',fname);
        return null;
    }

    delete p.bisformat;
    
    if (parseUserPreferences(p))
        return fname;
    return null;
};



/**
 * Loads the user preferences from the web browses datatabse
 * @param{Object} dbase -- a hande to bisweb_preferencedbase
 * @returns {Promise} - resolved if all is well
 */

let webLoadUserPreferences=function(dbase=null) {


    if (genericio.getenvironment()==='electron') {
        if (nodeLoadUserPreferences(null))
            return Promise.resolve();
        return Promise.reject();
    }


    //    console.log('In Web load');
    dbase = dbase  || dbasepointer;
    
    let keys=Object.keys(userPreferences);
    return new Promise( (resolve,reject) => {
        dbase.getItems(keys).then( (obj) => {
            if (parseUserPreferences(obj)) {
                dbasepointer=dbase;
                resolve();
            }
        }).catch( (e) => { reject(e); });
    });
};


/** 
 * Saves the user preferences from a file object or ${HOME}/.bisweb
 * @alias biswebUserPreferences.save
 * @param {String} filename - the current filename or ${HOME}/.bisweb
 * @returns {Promise} - if successful
 */
let saveUserPreferences=function(fname=null) {
    
    if (fname === null) 
        fname=getDefaultFileName();
    userPreferences['bisformat']="BisWebUserPreferences";
    let opt=JSON.stringify(userPreferences,null,2);
    delete userPreferences.bisformat;
    const fs = genericio.getfsmodule();

    try {
        console.log('Saving user preferences in ',fname);
        fs.writeFileSync(fname,opt);
    } catch(e) {
        console.log('Error=',e);
        return;
    }
    return true;
};

/**
 * Stores the user preferences to the web browses datatabse
 * @param{Object} dbase -- a hande to bisweb_preferencedbase or null to use last good pointer (from webLoad)
 * @returns {Promise} - resolved if all is well
 */

let storeUserPreferences=function(dbase) {

    if (genericio.getenvironment()==='electron') {
        if (saveUserPreferences())
            return Promise.resolve();
        return Promise.reject();
    }

    //    console.log('In Web store');
    dbase = dbase  || dbasepointer;
    return new Promise( (resolve,reject) => {
        dbase.setItems(userPreferences).then( () => {
            resolve();
        }).catch( (e) => { reject(e);});
    });
};

/** 
 * Returns the entire user preferences object
 * @alias biswebUserPreferences.getItem
 * @returns {String} - the current item key
 */
let getItem=function(item) {
    let a=userPreferences[item];
    if (a===undefined)
        return null;
    return a;
};

/** 
 * Returns the entire user preferences object
 * @alias biswebUserPreferences.setItem
 * @returns {String} key - the current key
 * @returns {String} value - the current value
 */
let setItem=function(key,value) {
    if (key==="orientationOnLoad")
        this.setImageOrientationOnLoad(value);
    else
        userPreferences[key]=value;
};

// -------------------------------- On Load if in browser -----------------------
// Load ${HOME}/.bisweb
// ------------------------------------------------------------------------------
if (genericio.getmode() !== 'browser')  {
    console.log(',,,,');
    let fname=nodeLoadUserPreferences();
    if (fname!==null) {
        console.log(",,,, bisweb commandline user preferences loaded from "+fname);
        console.log(',,,, ',JSON.stringify(userPreferences));
        console.log(',,,,');
    } else {
        console.log(',,,, Failed to read user preferences from default location');
        setImageOrientationOnLoad(userPreferences['orientationOnLoad'],null);
        fname=getDefaultFileName();
        if (saveUserPreferences(fname))
            console.log(',,,, \t created and saved user preferences in ',fname);
        console.log(',,,,');
    }
}

// ----------------------------
// Export Functions
// ----------------------------

module.exports = {
    getItem : getItem,
    setItem : setItem,
    //
    nodeLoadUserPreferences : nodeLoadUserPreferences,
    webLoadUserPreferences : webLoadUserPreferences,
    //
    storeUserPreferences :  storeUserPreferences,
    saveUserPreferences : saveUserPreferences,
    //
    sanitizeOrientationOnLoad : sanitizeOrientationOnLoad,
    setImageOrientationOnLoad : setImageOrientationOnLoad ,
    getImageOrientationOnLoad : getImageOrientationOnLoad,
};

