import {
    FETCH_INFO_LIST
} from './actionTypes.js'

export function fetchInfoList(){
  var list = Object.assign([])
  return dispatch => {
    firebase.database().ref('/infoItems/').once('value', snapshot => {
      var infoItems = snapshot.val()
      for (var key in infoItems) {
        if (infoItems.hasOwnProperty(key)) {
          let ItemWithKey = infoItems[key]
          ItemWithKey.key = key
          list = list.concat(ItemWithKey)
        }
      }
      dispatch({
        type: FETCH_INFO_LIST,
        payload: list
      })
    })
    .catch(err => {
      console.error("ERR: fetch infoItems: ", err);
    })
  }
}
