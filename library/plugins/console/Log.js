/**
 * Created by yatesmiao on 2018/11/3.
 */
import {
  Text,
  View,
  TouchableOpacity,
  PixelRatio
} from 'react-native'

import React from 'react'
import Plugin from '../Plugin'
import {getDate, isArray, isBoolean, isString, isFunction, isUndefined, isNull, isObject, isSymbol, isNumber, JSONStringify, getObjName} from './utils'
export default class Log extends Plugin {
  static propTypes = {
    log: React.PropTypes.object.isRequired,
    owId: React.PropTypes.string
  }
  constructor (props) {
    super(props)

    this.state = {
      callStackExpandable: true,
      logExpandable: true
    }
  }

  _parseBgColor (logType, rowId) {
    const methodList = ['warn', 'error']
    const bgColor = ['#FFFACD', '#FFE4E1']
    const borderColor = ['#FFB930', '#F4A0AB']

    if (methodList.indexOf(logType) !== -1) {
      return {
        backgroundColor: bgColor[methodList.indexOf(logType)],
        borderColor: borderColor[methodList.indexOf(logType)]
      }
    } else {
      return {
        backgroundColor: rowId % 2 === 1 ? '#fff' : '#f0f0f0',
        borderColor: '#BBC'
      }
    }
  }
  _parseFontColor (logType) {
    const methodList = ['log', 'info', 'warn', 'debug', 'error']
    const color = ['#414951', '#6A5ACD', '#FFA500', '#414951', '#DC143C']

    if (methodList.indexOf(logType) !== -1) {
      return {
        color: color[methodList.indexOf(logType)]
      }
    } else {
      return {
        color: color[0]
      }
    }
  }
  _renderLogForEachType (log, key, objectKey) {
    let element = null
    if (isArray(log)) {
      element = log.map((item, index) => this._renderLogForEachType(item, '#_renderLogForEachType' + index, String(index)))
    } else if (isString(log)) {
      element = objectKey
        ? <Text><Text style={{color: '#800080'}}>{objectKey}</Text>: <Text style={{color: '#8B0000'}}>"{log}"</Text></Text>
        : <Text style={{color: '#8B0000'}}>{log}</Text>
    } else if (isNumber(log)) {
      element = objectKey
        ? <Text><Text style={{color: '#800080'}}>{objectKey}</Text>: <Text style={{color: '#4169E1'}}>{log}</Text></Text>
        : <Text style={{color: '#4169E1'}}>{log}</Text>
    } else if (isObject(log)) {
      element = []
      for (let i in log) {
        element.push(this._renderLogForEachType(log[i], '#_renderLogForEachTypeObj' + i, String(i)))
      }
    } else if (isBoolean(log)) {
      element = <Text style={{color: '#800080'}}>{JSON.stringify(log)}</Text>
    }
    return <View style={{flex: 1}} key={key}>
      {element}
    </View>
  }
  _renderSimple (log, showType) {
    let outer = null
    let json = JSONStringify(log, '')
    if (json) {
      let preview = json.substr(0, 26)
      outer = showType ? getObjName(log) : ''
      if (json.length > 40) {
        preview += '...'
      }
      outer += ' ' + preview
    }
    return <Text>{outer}</Text>
  }
  _renderLog (log) {
    let element = null
    if (log && isArray(log)) {
      element = log.map((item, index) => {
        let simple = this._renderSimple(item, false)
        let _element = this.state.logExpandable ? null : this._renderLogForEachType(item, 'renderlogObj')
        return <TouchableOpacity key={'touchablerendertb' + index} onPress={() => { this.toggleLogExpandable() }}>
          {this.state.logExpandable
            ? <View><Text> ▸ {simple}</Text></View>
            : <View style={{
              flexDirection: 'row',
              flex: 1
            }}>
              <Text> ▾ </Text>
              {_element}
            </View>}
        </TouchableOpacity>
      })
    }
    return <View>
      {element}
    </View>
  }
  toggleCallStackExpandable () {
    this.setState(prevState => ({
      callStackExpandable: !prevState.callStackExpandable
    }))
  }
  toggleLogExpandable () {
    this.setState(prevState => ({
      logExpandable: !prevState.logExpandable
    }))
  }
  _renderCallStack (callstackArr) {
    let simple = this._renderSimple(callstackArr)
    let element = this.state.callStackExpandable ? null : this._renderLogForEachType(callstackArr)
    return <TouchableOpacity style={{
      paddingVertical: 5,
      marginTop: 10,
      borderTopWidth: 1 / PixelRatio.get(),

    }} onPress={() => { this.toggleCallStackExpandable() }}>
      {this.state.callStackExpandable
        ? <View><Text>callStack ▸ {simple}</Text></View>
        : <View><Text>callStack ▾ {simple}</Text></View>}
      {element}
    </TouchableOpacity>
  }
  _renderTime (ts) {
    const date = getDate(ts)
    const formattedDate = `${date.month}-${date.day} ${date.hour}:${date.minute}:${date.second}:${date.millisecond}`
    return <Text style={{color: 'green'}}>{formattedDate}：</Text>
  }
  render () {
    const {log, rowId} = this.props
    return (
      <View
        style={{
          borderBottomWidth: 1 / PixelRatio.get(),
          paddingTop: 5,
          paddingBottom: 5,
          paddingLeft: 5,
          ...this._parseBgColor(log.logType, rowId)
        }}>
        <View style={{flex: 1, flexDirection: 'row'}}>
          {this._renderTime(log.ts)}
        </View>
        {this._renderLog(log.msg)}
        {this._renderCallStack(log.callstackArr)}
      </View>
    )
  }
}

