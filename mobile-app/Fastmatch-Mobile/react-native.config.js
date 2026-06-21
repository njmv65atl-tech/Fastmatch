module.exports = {
  dependencies: {
    'react-native-iap': {
      platforms: {
        android: {
          packageImportPath: 'import com.dooboolab.rniap.RNIapPackage;',
          packageInstance: 'new RNIapPackage()'
        }
      }
    },
    'react-native-orientation-locker': {
      platforms: {
        android: {
          packageImportPath: 'import org.wonday.orientation.OrientationPackage;',
          packageInstance: 'new OrientationPackage()'
        }
      }
    }
  }
};
