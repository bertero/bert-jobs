var cron = require('cron')
var cronJob = cron.CronJob

module.exports = {
  jobH : jobH
}

function jobH (cronFrequency, functionToRun, ebEnvironmentNames, context, parameters){
  return new cronJob( cronFrequency, function(){ functionToRun(parameters) }, null, true, null, context )
}