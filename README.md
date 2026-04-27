# KISA 한국인터넷진흥원 - 디지털인증확산센터 지원 포털



---------------------------------------------------------------------------------------------------------

# 설정 방법 안내

## 1. 터미널 환경 설정

1. 터미널 내장 IDE 사용할 경우

    - 내장 터미널 사용 (ex. VS code)

2. 별도의 IDE 사용할 경우
    - git bash 설치
        - git bash 설치파일 다운로드 [64-bit Git for Windows Setup](https://github.com/git-for-windows/git/releases/download/v2.38.1.windows.1/Git-2.38.1-64-bit.exe)
        - 설치 후 마우스 우클릭 -> 'Git Bash here' 클릭하면 터미널 실행 됨

---

## 2. node.js 환경 설정

1. node 버전 관리를 위해 nvm 설치

    - [nvm 다운로드](https://github.com/coreybutler/nvm-windows/releases/download/1.1.10/nvm-setup.zip)

2. node.js 특정버전 설치 및 사용
    - 터미널 실행
    - 터미널$ nvm install v16.13.2 (본 프로젝트 환경은 node버전 10.15.3)
    - 터미널$ nvm use v16.13.2 (node 16.13.2 버전 사용하기)
    - 이런식으로 버전별 node를 설치 후 선택하여 사용 가능
    - nvm ls (설치된 node 버전 모두 보기)
    - nvm use vX.X.X (특정 node 버전 사용하기)

---

## 3. git clone

1. 작업할 폴더에서 터미널 실행 후

    - git clone https://gitlab.com/계정명/프로젝트명.git

2. 퍼미션 문제 발생할 경우

    - 터미널에서 다음을 실행 (참고 https://zeddios.tistory.com/120)
        - ssh-keygen -t rsa -C "자기 gitlab 이메일 아이디" (ex. ssh-keygen -t rsa -C "darum.ehjung@gmail.com")
        - 'enter file in which to save the key....'라고 나오면 엔터
        - 'enter passphrase....'라고 나오면 자기만의 비번 입력하거나 엔터 (엔터치면 비번 없이 진행)
        - 'enter same passphrase again' 나오면 위에 입력했던 비번 똑같이 한번 더 입력
        - c:/Users/xxxx/.ssh/ 경로로 이동
        - id_rsa.pub 파일을 에디터로 열고 내용 복사
        - gitlab 로그인 > clone하려는 저장소로 이동 > settings > repository > deploy Keys (expand 클릭)
        - Title에 자기마음대로 타이틀 입력
        - Key에 id_rsa.pub에서 복사한 내용 붙여넣기
        - Write access allowed 에 체크
        - Add key 클릭
        - 등록 완료되면 git clone 진행 (반드시 ssh 링크로 클론)

3. git 공부하기
    - https://milooy.wordpress.com/2017/06/21/working-together-with-github-tutorial/
    - https://backlog.com/git-tutorial/kr/
    - https://git-scm.com/book/ko/v1/%EC%8B%9C%EC%9E%91%ED%95%98%EA%B8%B0

---

## 4. gulp 및 프로젝트 환경 세팅

1. gulp 전역 설치 (이미 설치된 경우 생략)

    - npm install -g gulp

2. yarn 전역 설치 (이미 설치된 경우 생략)

-   npm install -g yarn

3. 패키지 모듈 설치 (package.json 있는 경우)

    - yarn install

4. 작업시작

    - yarn gulp
        - 자동으로 빌드 된 후 http://localhost:3000 자동 실행
        - 파일 수정시 자동으로 새로고침 됨

5. 작업 완료 후 산출물 생성
    - yarn gulp build
        - ./dist/ 폴더에 산출물 생성

---

## 5. 폴더 구조

-   markup (기본작업폴더)
    -   assets
        -   fonts (폰트파일)
        -   img (이미지)
        -   js (프로젝트용 js)
            -   lib (js 라이브러리 및 플러그인)
        -   css
            -   scss (프로젝트용 scss)
                -   import (기본세팅용 scss)
            -   lib (플러그인용 css)
    -   html (HTML)
        -   include (인클루드용 html)
    -   \_coding_list (코딩리스트 data 파일 폴더)
    -   \_guide (퍼블리싱 가이드(각자 입맛에 맞게 사용, 사용해도 되고 안해도 됨))

---

## 6. scss 설정 파일 설명

-   \_reset-css.scss (css리셋)
-   \_px-convert.scss (px->rem, px->vw 자동변환용)
-   \_variables.scss (프로젝트 공통 변수 설정)
-   \_lib-fonts.scss (웹폰트 링크 설정)
-   \_typography.sass (폰트사이즈, 스타일, 컬러 등 설정)
-   \_mixin.scss (각종 mixin)
-   \_base.scss (필수 설정 scss가 import되어 있으니 새로운 scss를 추가할때 꼭 import 해줄것)

-   common.scss 기본 import

```
@import "import/lib-fonts";
@import "base";
@import "import/typography";
@import "import/reset-css";
```

-   추가하는 scss 기본 import

```
@import "base";
```

---

## 7. html include

-   인클루드 할 파일을 '\_파일명.html' 형태로 생성
-   인클루드 할 위치에 아래의 코드 삽입

```
<!--#include file="./_파일명.html"-->   (※경로주의)
```

---
