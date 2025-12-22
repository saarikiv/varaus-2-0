import {
    FETCH_TERMS
} from './actionTypes.js'

export function fetchTerms(){
  var list = Object.assign([])
  return dispatch => {
    firebase.database().ref('/terms/').once('value', snapshot => {
      var terms = snapshot.val()
      for (var key in terms) {
        if (terms.hasOwnProperty(key)) {
          let ItemWithKey = terms[key]
          ItemWithKey.key = key
          list = list.concat(ItemWithKey)
        }
      }
      dispatch({
        type: FETCH_TERMS,
        payload: list
      })
    })
    .catch(err => {
      console.error("ERR: fetch terms: ", err);
    })
  }
}