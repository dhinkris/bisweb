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


#ifndef _bis_ComboTransformation_h
#define _bis_ComboTransformation_h

#include "bisGridTransformation.h"
#include "bisMatrixTransformation.h"
#include <vector>

/**
 * Implements a combination of a single "initial" linear transformation and a collection of grid transformations
 * Used to store results of non linear registrations
 */

class bisComboTransformation : public bisAbstractTransformation {
  
 public:

  /** Constructor
   * @param n used to set class name 
   */
  bisComboTransformation(std::string n="comboxform");

  /** Destructor */
  virtual ~bisComboTransformation();
  
  /** Sets the linear component to identity and removes all grids */
  virtual void identity();

  /** Sets the linear (intial) transformation 
   * @param pre_xform input transformation
   */
  void   setInitialTransformation(bisMatrixTransformation *pre_xform);

  /** Sets the linear (intial) transformation from a 4x4 matrix
   * @param m input 4x4 matrix
   */
  void   setInitialTransformation(bisUtil::mat44 m);

  /** Get Number Of Grid Transformations */
  int getNumberOfGridTransformations();

  /** Get a Grid Transformation 
   * @param index index of transformation to get
   * @returns a shared pointer to grid[index]
   */
  std::shared_ptr<bisGridTransformation> getGridTransformation(int index);
  
  /** Transform point x to y 
   * @param x input point
   * @param y output point
   */
  virtual void transformPoint(float x[3],float y[3]);

  /** adds a grid transformation to the list
   * @param additional_transformation grid to add
   */
  void addTransformation(std::shared_ptr<bisGridTransformation> additional_transformation);


  /** deSerialize this object to a pointer (which has been pre-allocated).
   * Afte parsing the header it deserializes each component transformation in sequence.
   * @param  pointer place to store output from
   */
  virtual int deSerialize(unsigned char* pointer);

  /** serialze this class to provided pointer. After a short header, it serializes
   * all components one by one.
   * @param output pointer to store data in
   */
  virtual void serializeInPlace(unsigned char* output);

  /** returns size needed to serialize this object in bytes */
  virtual int getRawSize();


  /** serialize to Text 
   * @param debug print diagnostic messages if > 0
   * @returns a string
   */
  virtual std::string textSerialize(int debug=0);

  /** parse from Text 
   * @param lines (a vector of lines)
   * @param offset the line to begin parsing (at end the last line)
   * @param debug print diagnostic messages if > 0
   * @returns 1 if pass 0 if fail
   */
  virtual int textParse(std::vector<std::string>& lines,int& offset,int debug=0);


protected:

  /** Initial Linear Transformation */
  std::shared_ptr<bisMatrixTransformation> initialLinearTransformation;

  /** List of Grid Transformations */
  std::vector<std::shared_ptr<bisGridTransformation> > gridTransformationList;
    

private:

  /** Copy constructor disabled to maintain shared/unique ptr safety */
  bisComboTransformation(const bisComboTransformation&);

  /** Assignment disabled to maintain shared/unique ptr safety */
  void operator=(const bisComboTransformation&);  
	
};

#endif
