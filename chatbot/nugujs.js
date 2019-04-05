'use strict';


module.exports = (valueJson) => {
  let jsonReturn = {
    "version": "2.0",
    "resultCode": "OK",
    "directives": {
      "AudioPlayer": {
        "type": "AudioPlayer.Play",
        "audioitems": {
          "stream": {
            "url": "",
            "offsetInMilliseconds": "",
            "progressReport": {
              "progressReportDelayInMilliseconds": "",
              "progressReportIntervalInMilliseconds": ""
            },
            "token": "",
            "expectedPreviousToken": ""
          },
          "metadata": {}
        }
      }
    }

  }
  jsonReturn.output = valueJson
  return jsonReturn;
}
