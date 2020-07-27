import Plugin from '../Plugin'
import { FetchLog, ProxyFetch } from '../utils/ProxyFetch'
import { FlatList, View, TextInput } from 'react-native'
import React from 'react'
import Tab from '../../components/Tab'
import ButtonGroup from '../components/ButtonGroup'
import { realOnePixel } from '../utils/DumpObject'
import Button from '../components/Button'

const TABS = {
  Request: 'Request',
  ReRequest: 'ReRequest'
}
const TAB_LIST = Object.values(TABS)

export default class Network extends Plugin {
  static setup (options) {
    if (Network.isProxy) {
      return
    }
    Network.isProxy = true

    // proxy fetch
    Network._proxyFetch = new ProxyFetch(window)
    Network._proxyFetch.onUpdate((fetchList) => {
      if (Network.currentInstance && !Network.currentInstance._isRender) {
        Network.currentInstance._updateList(TABS.Request, fetchList)
      }
    })
    // 请求重发更新
    Network._proxyFetch.onReUpdate((fetchList) => {
      if (Network.currentInstance && !Network.currentInstance._isRender) {
        Network.currentInstance._updateList(TABS.ReRequest, fetchList)
      }
    })
  }
  static _getFetchList (logType) {
    if (!Network._proxyFetch) {
      return []
    }
    return logType === TABS.Request ? Network._proxyFetch.getFetchList() : Network._proxyFetch.getReFetchList()
  }
  constructor (props) {
    super(props)
    this.state = {
      listMap: {
        [TAB_LIST[0]]: Network._getFetchList(TAB_LIST[0]),
        [TAB_LIST[1]]: Network._getFetchList(TAB_LIST[1])
      },
      searchTextMap: {
        [TAB_LIST[0]]: '',
        [TAB_LIST[1]]: ''
      }
    }
    Network.currentInstance = this
    this.buttonList = [{
      name: 'Bottom',
      onPress: this._gotoBottom
    }, {
      name: 'Clean',
      onPress: () => {
        if (this.tabName === TABS.Request) {
          Network._proxyFetch.clearFetchList()
        } else {
          Network._proxyFetch.clearReFetchList()
        }
        this.setState({
          listMap: {
            ...this.state.listMap,
            [this.tabName]: []
          }
        })
      }
    }]
    this._refs = {}
    this.tabName = TABS.Request
  }

  _updateList (logType, list) {
    this.setState({
      listMap: {
        ...this.state.listMap,
        [logType]: list
      }
    })
  }

  _updateListBySearchText = (searchText) => {
    searchText = searchText.toLowerCase().trim()
    const list = Network._getFetchList(this.tabName)
    this.setState({
      searchTextMap: {
        ...this.state.searchTextMap,
        [this.tabName]: searchText
      }
    })
    this._updateList(this.tabName, list.filter((data) => !searchText || data.url.indexOf(searchText) > -1))
  }

  _renderSeparator = () => {
    return (
      <View style={{height: realOnePixel, backgroundColor: '#AAAAAA'}} />
    )
  }
  _renderHeader = () => {
    return (
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        margin: 5
      }}>
        <TextInput
          value={this.state.searchTextMap[this.tabName]}
          style={{
            paddingHorizontal: 5,
            height: 40,
            fontSize: 16,
            borderWidth: realOnePixel,
            borderColor: 'gray',
            borderRadius: 5,
            flex: 1
          }}
          keyboardType={'ascii-capable'}
          autoCorrect={false}
          iosreturnKeyType={'search'}
          placeholder={'input url segment to search, case insensitive'}
          onChangeText={this._updateListBySearchText}
        />
        <Button style={{marginLeft: 5}} text={'Clean'} onPress={() => {
          this._updateListBySearchText('')
        }} />
      </View>
    )
  }
  _renderNetwork (logType) {
    const fetchList = this.state.listMap[logType]
    return {
      title: logType + `(${fetchList ? fetchList.length : 0})`,
      renderContent: () => (
        <FlatList
          key={logType}
          data={fetchList}
          renderItem={({item}) => (
            <FetchLog data={item} />
          )}
          ListHeaderComponent={this._renderHeader}
          keyExtractor={(item) => item.rid}
          ItemSeparatorComponent={this._renderSeparator}
          onEndReachedThreshold={0.5}
          ref={this._onRef(logType)}
        />
      )
    }
  }
  _onChange = (index) => {
    this.tabName = TAB_LIST[index]
  }
  _onRef = (method) => {
    return (ref) => {
      this._refs[method] = ref
    }
  }
  _gotoBottom = () => {
    this._refs[this.tabName] && this._refs[this.tabName].scrollToEnd()
  }
  render () {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#FFFFFF'
        }}>
        <Tab
          style={{flex: 1}}
          onChangePage={this._onChange}
          initPage={0}
          pages={TAB_LIST.map((item) => this._renderNetwork(item))}
        />
        <ButtonGroup
          list={this.buttonList}
        />
      </View>
    )
  }
}
