/**
 * @function - 쿠키
*/
var Cookie = function () {
  /*
    var c = new Cookie();
    c.set('test', 'asdf', 7);
    console.log(c.get('test'));
  //*/
  var func = {
    //new Cookie().set('name', 'Ethan', 7);
    set: function(name, value, exp) {
      if(!exp) exp = 3;
      var date = new Date();
      date.setTime(date.getTime() + exp*24*60*60*1000);
      document.cookie = name + '=' + value + ';expires=' + date.toUTCString() + ';path=/';
    },
    //new Cookie().get('name');
    get: function(name) {
      var value = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
      return value? value[2] : null;
    },
    //new Cookie().delete('name');
    delete: function(name) {
      document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/;';
    },
    //new Cookie().clear();
    clear: function () {
      var value = document.cookie.split(';');
      var self = this;
      value.forEach(function (key, idx) {
        self.delete(key.trim());
      });
    },
    getInstance: function () {
      return this;
    }
  }
  return func;
}

/**
 * @function - 세션및 스토리지
*/
var Storage = function (isLocalStorage) {
  var storage = (isLocalStorage? window.localStorage: window.sessionStorage);
  var func = {
    //값 세팅
    //new Storage().set('key', 'value');
    set: function (key, value) {
      storage.setItem(key, value);
    },
    //console.log(new Storage().get('key'));
    get: function (key) {
      return storage.getItem(key);
    },
    //new Storage().remove('key');
    remove: function (key) {
      storage.removeItem(key);
    },
    //new Storage().clear();
    clear: function () {
      storage.clear();
    },
    getInstance: function () {
      return storage;
    },
    valueCallback: function (obj, token, cb) {
      for(var key in obj){
        var  value = obj[key];
        var isKey = key.indexOf(token) > -1;

        if(typeof value == 'string' && isKey){
          cb.call(obj, key, value);
        }
      }
    }
  }
  return func;
}

var Codinglist = function () {

  /**
 * @function - 토글링 후 트리구조를 세션 정보에 저장
*/
  var setSessionTree = function (obj) {
    var children = obj.childNodes;
    for(var key in children){
      var cursor = children[key];
      if(cursor.nodeType == 1){
        var index = cursor.getAttribute('data-row-seq');
        var className = cursor.getAttribute('class');
        var temp = 'list_'+index;

        storage.set(temp, className);
      }
    }
  }

  /**
 * @function - 페이지 랜딩후 세션 트리 세팅
*/
  var loadOne = function (obj) {
    var children = obj.childNodes;
    storage.valueCallback(storage.getInstance(), 'list_' , function (key, value) {
      var index = parseInt(key.substring('list_'.length), 10);

      for(var key in children){
        var cursor = children[key];
        if(cursor.nodeType == 1){
          var seq = parseInt(cursor.getAttribute('data-row-seq'), 10);
          if(index == seq){
            cursor.setAttribute('class', value);
          }
        }
      }
    });

    var pastLink = storage.get('clicked');
    pastLink = (pastLink ? pastLink: '../Ma-001.html'); // 프로젝트 상황에 맞게 수정
    // pastLink = (pastLink ? pastLink: '../index.html'); // 프로젝트 상황에 맞게 수정
    if(parent['mainframe']) parent['mainframe'].location = pastLink;
  }

  var clickFunc = function (evt, el) {
    var tr = tableBody.getElementsByTagName('tr');
    for(var key in tr){
      var temp = tr[key];
      if(temp.nodeType == 1 && !temp.classList.contains('node')){
        temp.classList.remove('clicked');
      }
    }
    el.parentNode.parentNode.classList.add('clicked');
    storage.set("clicked", el.getAttribute('href'));
    setSessionTree(tableBody);
  }


  /**
 * @function - 토글링
*/
  var toggle = function (evt, el) {
    evt.preventDefault();
    var closest = el.parentNode.parentNode.parentNode;    //a의 상위 노드를 검색
    var isClose = closest.classList.contains('close');
    var cursor = closest;

    closest.classList.toggle('close', !isClose);
    closest.classList[(isClose? 'remove': 'add')]('plus');

    var show = function (cursor, status) {
      var thisStep = parseInt(cursor.getAttribute('data-step'), 10);
      var rowSEQ = parseInt(cursor.getAttribute('data-row-seq'), 10);
      do{
        cursor = (cursor.nextElementSibling);
        if(!cursor) break;
        var step = parseInt(cursor.getAttribute('data-step'), 10);
        if(thisStep >= step) break;
        cursor.classList[(!status? 'add': 'remove')]('off');
      }while(step > thisStep);
    }
    show(closest, isClose);

    if(isClose){
      var obj = document.getElementsByClassName('close');
      for(var x=0 ; x<obj.length; x++){
        var temp = obj[x];
        show(temp, false);
      }
    }
    setSessionTree(tableBody);
  }

  /**
 * 상단부분의 전체열기/ 전체닫기
*/
  topShow = function (evt, el, isShow) {
    evt.preventDefault();
    var obj = tableBody;

    var children = obj.childNodes;
    for(var key in children){
      var cursor = children[key];
      if(cursor.nodeType == 1){

        switch(isShow){
          case 'open':
              cursor.classList.remove('off');   //hidden
              cursor.classList.remove('plus');
              cursor.classList.remove('close');
          break;
          case 'close':
              var isNode = cursor.classList.contains('node');
              var step = parseInt(cursor.getAttribute('data-step'), 10);
              cursor.classList.add('off');

              if(isNode && step == 1){
                cursor.classList.add('plus');
                cursor.classList.add('close');
                cursor.classList.remove('off');
              }
          break;
        }
      }
    };
    setSessionTree(tableBody);

    if(isShow == 'clear') {
      storage.clear();
      location.reload();
    }
  }

  /**
 * @function - 유니크 키값
*/
  function guid() {
    function s4() {
      return ((1 + Math.random()) * 0x10000 | 0).toString(16).substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  }
  /**
 * @function - 유니크 시퀀스값
*/
  var seq = (function(){ var id=0; return function(){ return id++;} })();

  /**
 * @function - json 최대 깊이값 리턴
*/
  function getMaxDepth(obj) {
    let res = JSON.stringify(obj).replace(/[^{|^}]/g, '')
    while (/}{/g.test(res)) {
      res = res.replace(/}{/g, '')
    }
    return res.replace(/}/g, '').length;
  }

  /**
 * @function - object의 depth 정보를 리턴
*/
  var checkHasProperty = function (data, val) {
    var step = 0;
    function hasOwnDeepProperty(obj, prop) {
      if (typeof obj === 'object' && obj !== null) {
        if (obj.hasOwnProperty(prop)) {
          return { has: true, step: ++step};
        }
        for (var p in obj) {
          if (obj.hasOwnProperty(p) && hasOwnDeepProperty(obj[p], prop).has) {
            return { has: true, step: ++step};
          }
        }
      }
      return { has: false, step: step };
    }
    return hasOwnDeepProperty(data, val);
  }

var testOne = function (data) {
  var each = function(obj, cb, ctx){
      if (!obj) { return obj; }
      var i, len,
              hasOwn = Object.prototype.hasOwnProperty;

      if (obj && obj instanceof Array) {
          if (obj.forEach) {
              if (obj.forEach(cb, ctx) === false) { return; }
          } else {
              for (i = 0, len = obj.length; i < obj.length; i++) {
                  if (cb.call(ctx || obj, obj[i], i, obj) === false) { return; }
              }
          }
      } else {
          for(i in obj) {
              if (hasOwn.call(obj, i)) {
                  if (cb.call(obj, obj[i], i, obj) === false) { return; }
              }
          }
      }
      return obj;
  }

  each(data, function(item, key) {
    var isArr = toString.call(item) === '[object Array]' || item instanceof Array;
    console.log(key, isArr);
    if(!isArr){
      testOne(item, key);
    }
  });
}

  /**
 * @function - html 링크 구성
*/
  var setChild = function (datas, opts) {
    //testOne(datas);
    var _step = {};
    var maxDepth = getMaxDepth(datas);
    var getChild = function (data) {
      for(var key in data){
        var temp = data[key];
        var isArray = temp instanceof Array;
        var step = checkHasProperty(datas, key);

        if(isArray){
          var r = (_step.step+1)-step.step;

          if(r < 0) step.step = _step.step+1;
          if(_step.title == key) step.step = _step.step+1;

          opts.link.call(this, key, temp, step, maxDepth);//!~
        }else{
          opts.node.call(this, key, temp, step, maxDepth);
          _step.title = key;
          _step.step = step.step;

          getChild(temp);
        }
      }
    }
    getChild(datas);
  }

  var bodyHTML = [];
  setChild(dataset.links, {
    link: function (title, data, step, maxDepth) {
      var result = '';

      for(var x=0 ; x< step.step-1; x++){
        var txt = (x+1==step.step-1 ? '': '&nbsp;');
        var className = (x+1==step.step-1 ? 'link-node': '');
        result += '<td class="row_'+(x)+' '+(className)+' empty">'+(txt)+'</td>';
      }
      var colspan = maxDepth-(step.step-1);
      var _result = dataset.templete.detail[1].replace(/{href}|{target}|{subject}|{status}|{colspan}|{class}|{comment_class}|{comment}|{td_class}/gi, function (txt) {
        switch(txt.replace(/^{|}*$/gi, '').toLowerCase()){
          case 'td_class':
            return 'row_'+(step.step-1);
            break;
          case 'href':
            return data[0];
            break;
          case 'target':
            return data[1];
            break;
          case 'subject':
            return title;
            break;
          case 'colspan':
            return colspan;
            break;
          case 'comment_class':
            var temp = '';
            if(data[3] != 'comment' && data[3].length> 0) temp =  'comment on';
            return temp;
            break;
          case 'class':
            var status = null;
            switch(data[2]){
              case '완료':
                status = 'done';
                break;
              case '컨펌대기':
                status = 'confirm';
                break;
              case '수정':
                status = 'modify';
                break;
              case '진행중':
                status = 'ing';
                break;
              case '기타':
                status = 'etc';
                break;
              case '대기':
                status = 'wait';
                break;
              case '홀드':
                  status = 'hold';
                  break;
              case '삭제':
                status = 'del';
                break;
            }
            return status;
            break;

          case 'comment':
            var temp = data[3];
            if(temp == 'comment') temp = '';

            return temp;
            break;
          default:
            return txt;
            break;
        }
      });
      result = '<tr data-step="'+(step.step)+'" data-row-seq="'+(seq())+'">'+result+_result+'</tr>';

      bodyHTML.push(result);
      return result;
    },
    node: function (title, data, step, maxDepth) {
      var result = '';
      for(var x=0 ; x< step.step-1; x++){
        var txt = (x+1==step.step-1 ? '': '&nbsp;');
        var className = (x+1==step.step-1 ? 'child-node': '');
        result += '<td class="row_'+(x)+' '+(className)+' empty">'+(txt)+'</td>';
      }
      result += dataset.templete.detail[0].replace(/{html}/gi, function (txt) {
        switch(txt.replace(/^{|}*$/gi, '').toLowerCase()){
          case 'html':
            var colspan = maxDepth-(step.step-1);
            return '<td colspan="'+(colspan)+'" class="row_'+(x)+'">'+dataset.templete.h2Title.replace(/{title}/gi, function (txt) {
              switch(txt.replace(/^{|}*$/gi, '').toLowerCase()){
                case 'title':
                  return title;
                  break;
              }
            })+'</td>';
            break;
        }
      });
      result = '<tr data-step="'+(step.step)+'" class="node"  data-row-seq="'+(seq())+'">'+result+'</tr>';
      bodyHTML.push(result);
      return result;
    }
  });

  tableBody = document.getElementById('table_body');
  tableBody.innerHTML = bodyHTML.join('\n');

  document.getElementById('project_title').innerHTML = dataset.header.title+"<br/><button onclick=\"topShow(event, this, 'open')\">전체열기</button><button onclick=\"topShow(event, this, 'close')\">전체닫기</button><button onclick=\"topShow(event, this, 'clear')\">쿠키초기화</button>";      //타이틀 수정
  document.getElementsByTagName('title')[0].innerHTML = dataset.header.title;     //head.title 수정
  parent.document.title = dataset.header.title;

  storage = new Storage(true);        //로컬스토리지 사용
  toggleFunc = toggle;     //토글용 함수 생성
  clickFuncs = clickFunc;   //클릭했을때
  loadOne(tableBody);		//세션정보에 대한 display 설정
}
