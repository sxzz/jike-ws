import WebSocket from 'ws'
import os from 'os'
import { readFileSync } from 'fs'
import path from 'path'

const config = JSON.parse(
  readFileSync(
    path.resolve(os.homedir(), '.config/jike-cli/config.json'),
    'utf-8'
  )
)

const WS_URL = 'wss://jike-io.ruguoapp.com/socket.io/?transport=websocket'
const deviceId = config.users[0].deviceId
const accessToken = config.users[0].accessToken

const ws = new WebSocket(WS_URL, {
  headers: {
    'x-jike-device-id': deviceId,
    'x-jike-access-token': accessToken,
  },
})

ws.on('message', (rawData) => {
  const [, code, , command, textData] = rawData
    .toString('utf-8')
    .match(/^(\d+)(\/(.*?),)?(.*)$/)
  let jsonData: any = undefined
  try {
    jsonData = JSON.parse(textData)
  } catch {
    jsonData
  }
  switch (+code) {
    case 0:
      ready(jsonData)
      break
    case 3:
      console.log('PONG')
      break
    case 42:
      console.log(command, jsonData)
    default:
      console.log('reveice', code, textData)
  }
})

ws.on('close', (code, reason) => {
  console.log('Closed', code, reason.toString())
})

function ready(data: Record<string, any>) {
  console.log('READY')
  console.log(data)

  ws.send('40/personal-update,')
  ws.send('40/notification,')

  setInterval(() => {
    if (ws.readyState !== ws.OPEN) return
    ws.send('2')
    console.log('PING')
  }, data.pingInterval)
}
