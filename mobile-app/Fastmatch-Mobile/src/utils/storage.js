
// src/utils/storage.js
import AsyncStorage from '@react-native-async-storage/async-storage';






export const saveUser = async ({_userId, _userName}) => {
  console.log("enter in saveUser")
    console.log(_userId,_userName)
  try {
    await AsyncStorage.setItem('_userId', _userId);
  await AsyncStorage.setItem('_userName', _userName);
  
    await getUser()
  } catch (error) {
    console.log(`error is occuring during setting the aysnc storage`)
  }
};

export const getUser = async () => {
    let _userId = "default"
    let _userName = "default"
  
    try {
    _userId = await AsyncStorage.getItem('_userId');
    _userName  = await AsyncStorage.getItem('_userName');
  if(_userId || _userName){
    console.log("the userId is : ",_userId)
    console.log("the userName is : ",_userName)
    console.log(`data is saved successfully in async storage : userName : ${_userName}  userId : ${_userId}`)
  }
    
  } catch (error) {
    console.log("the error is during the getting form aynch storag")
  }
  return { _userId, _userName };
};




export const removeIdName = async() =>{
  try {
    await AsyncStorage.multiRemove(['_userId', '_userName']);
    console.log('keys removed ✅');
  } catch (error) {
    console.log("Error removing async data");
  }
}