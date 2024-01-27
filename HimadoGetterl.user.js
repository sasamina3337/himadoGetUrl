// ==UserScript==
// @name         ひまわり動画ゲッター
// @namespace    https://github.com/sasamina3337/
// @description  ひまわり動画内に動画url取得用のボタンを表示させる
// @namespace    http://tampermonkey.net/
// @version      1.12
// @author       sasamina
// @match        http://himado.in/*
// @match        https://web.archive.org/*
// @grant        none
// @updateURL    https://github.com/sasamina3337/himadoGetUrl/HimadoGetterl.user.js
// ==/UserScript==

(function() {
    'use strict';

    // ここに関数を定義する
    function extractDomain(url) {
        if (!url || !url.trim()) {
            return ''; // 空または無効なURLの場合は空文字列を返す
        }
        try {
            const parsedUrl = new URL(url);
            return parsedUrl.hostname;
        } catch (e) {
            console.error('Invalid URL:', url);
            return ''; // URL解析エラーの場合も空文字列を返す
        }
    }

    function decodeURL(encodedUrl) {
        try {
            // decodeURIComponent関数を使用してエンコードされたURLをデコードする
            return decodeURIComponent(encodedUrl);
        } catch (e) {
            // エラーが発生した場合は、エラーメッセージをコンソールに出力し、元のエンコードされたURLを返す
            console.error('decodeURL error:', e);
            return encodedUrl;
        }
    }

    function checkVideoAvailability(url) {
        // 新しいvideo要素を作成
        var video = document.createElement('video');

        // video要素のcanPlayTypeメソッドを使用してメディアタイプのサポートをチェック
        var canPlayMp4 = video.canPlayType('video/mp4').replace(/no/, '');
        var canPlayWebm = video.canPlayType('video/webm').replace(/no/, '');

        // URLからファイルの拡張子を取得する
        var extension = url.split('.').pop().split(/\#|\?/)[0];

        // 拡張子に基づいてサポート状況をチェックする
        if ((extension === 'mp4' && canPlayMp4) || (extension === 'webm' && canPlayWebm)) {
            // サポートされていると判断する
            return true;
        } else {
            // サポートされていないと判断する
            return false;
        }
    }


    function buildUI(videoList, availableMovieUrl) {
        // モーダルウィンドウのコンテナを作成
        const modalContainer = document.createElement('div');
        modalContainer.id = 'videoModal';
        modalContainer.style.position = 'fixed';
        modalContainer.style.left = '0';
        modalContainer.style.top = '0';
        modalContainer.style.width = '100%';
        modalContainer.style.height = '100%';
        modalContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        modalContainer.style.zIndex = '1000';
        modalContainer.style.display = 'flex';
        modalContainer.style.justifyContent = 'center';
        modalContainer.style.alignItems = 'center';

        // モーダルウィンドウの内容を格納するためのdivを作成
        const modalContent = document.createElement('div');
        modalContent.style.backgroundColor = '#fff';
        modalContent.style.padding = '20px';
        modalContent.style.borderRadius = '5px';
        modalContent.style.width = '80%';
        modalContent.style.maxHeight = '80vh';
        modalContent.style.overflowY = 'auto';

        // 閉じるボタンの作成
        const closeButton = document.createElement('button');
        closeButton.textContent = 'X';
        closeButton.style.position = 'absolute';
        closeButton.style.top = '10px';
        closeButton.style.right = '10px';
        closeButton.addEventListener('click', function() {
            modalContainer.style.display = 'none';
        });

        // テーブルの作成
        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';

        // 各動画情報の行をテーブルに追加
        videoList.forEach(function(video, index) {
            const row = document.createElement('tr');

            // 動画番号とドメイン
            const domainCell = document.createElement('td');
            domainCell.textContent = `${index + 1}: ${extractDomain(video)}`;
            domainCell.style.cursor = 'pointer';
            domainCell.onclick = function() {
                copyToClipboard(video);
            };
            row.appendChild(domainCell);

            // 再生可能かのステータス
            const statusCell = document.createElement('td');
            statusCell.textContent = availableMovieUrl[index] ? '再生可能' : '再生不可能';
            row.appendChild(statusCell);

            // サムネイルの表示
            const thumbCell = document.createElement('td');
            const thumbImage = document.createElement('img');

            // 再生可能な場合はスクリプトからURLを取得し、そうでない場合は固定の画像を使用
            thumbImage.src = availableMovieUrl[index] ? decodeURL(video) : 'http://himado.in/image/himatan/noimage130.png';
            thumbImage.style.width = '80px';
            thumbImage.style.height = '60px';
            thumbImage.style.cursor = 'pointer';

            // サムネイルクリック時の遷移処理（必要に応じて）
            thumbImage.onclick = function() {
                window.location.href = 'https://sakudo.in/?id=' + movie_id + '&file=' + encodeURIComponent(video);

            };

            thumbCell.appendChild(thumbImage);
            row.appendChild(thumbCell);

            table.appendChild(row);
        });

        // モーダルコンテンツに要素を追加
        modalContent.appendChild(closeButton);
        modalContent.appendChild(table);
        modalContainer.appendChild(modalContent);

        // モーダルコンテナをbodyに追加
        document.body.appendChild(modalContainer);
    }

    function copyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);

        alert('URLをクリップボードにコピーしました: ' + text);
    }


    function displayThumbnail(base64Data, elementId) {
        // イメージ要素を作成
        const image = document.createElement('img');
        // Base64エンコードされた画像データをソースとして設定
        image.src = base64Data; // 'data:image/png;base64,' はbase64Dataに含まれていると仮定
        // 画像のスタイルを設定（必要に応じて）
        image.style.width = '100px'; // 幅を設定
        image.style.height = 'auto'; // 高さを自動調整
        image.alt = 'サムネイル'; // 代替テキストを設定

        // 指定されたIDを持つ要素を取得
        const containerElement = document.getElementById(elementId);
        if (containerElement) {
            // イメージ要素をDOMに追加
            containerElement.appendChild(image);
        } else {
            console.error('Element with id ' + elementId + ' not found.');
        }
    }

    function getVideoUrls() {
        var movieUrls = [];
        var ary_spare_sources_flash = window.ary_spare_sources_flash || {};

        // movie_url を先頭に追加（有効な場合のみ）
        var movieUrl = window.movie_url || '';
        if (movieUrl.trim() && movieUrl.startsWith('external:')) {
            movieUrl = movieUrl.replace('external:', '');
        }
        if (movieUrl.trim() && movieUrl.startsWith('external%3A')) {
            movieUrl = movieUrl.replace('external%3A', '');
        }
        if (movieUrl.trim()) {
            movieUrls.push(decodeURL(movieUrl));
        }

        // ary_spare_sources_flash から追加のURLを追加（有効な場合のみ）
        if (ary_spare_sources_flash && ary_spare_sources_flash.spare) {
            ary_spare_sources_flash.spare.forEach(function(source) {
                var url = decodeURL(source.src);
                if (url.trim() && url.startsWith('external:')) {
                    url = url.replace('external:', '');
                }
                if (url.trim() && url.startsWith('external%3A')) {
                    url = url.replace('external%3A', '');
                }
                if (url.trim()) {
                    movieUrls.push(url);
                }
            });
        }

        return movieUrls;
    }

    function updateUIWithVideoAvailability(videoUrls) {
        // 再生可能な動画URLの状態を保持する配列
        const availableMovieUrls = videoUrls.map(url => {
            // ここでは拡張子のチェックだけを行っていますが、
            // 実際にはサーバーへのHEADリクエストなどでファイルの存在を確認することが望ましいです。
            return checkVideoAvailability(url); // 先に実装した関数を利用
        });

        // UIを構築する関数を呼び出し、動画リストと再生可能性を渡します
        buildUI(videoUrls, availableMovieUrls);
    }
    // メインの関数
    function main() {
        // 動画取得ボタンを追加するコード
        // ボタンを作成する
        const fetchVideoButton = document.createElement('button');
        fetchVideoButton.textContent = '動画取得';
        fetchVideoButton.style.marginLeft = '10px';
        // ボタンにイベントリスナーを追加する
        fetchVideoButton.addEventListener('click', function(event) {
            // デフォルトのフォーム送信を防止
            event.preventDefault();
            const videoUrls = getVideoUrls(); // 動画URLリストを取得

            // movie_url と ary_spare_sources_flash が空かどうかを確認
            if (videoUrls.length === 0) {
                // 両方とも空の場合、指定されたURLにリダイレクト
                window.location.href = 'https://web.archive.org/web/0/' + window.location.href;
                return;
            }

            // それ以外の場合は通常の処理を実行
            updateUIWithVideoAvailability(videoUrls); // 取得したURLリストでUIを更新
            console.log('取得した動画URLのリスト:', videoUrls);
            console.log('動画取得ボタンがクリックされました。');
        });

        // ボタンをページの適切な場所に挿入する
        // ここでは例としてページの最上部にボタンを追加するコードを書きます
        const mySourceElement = document.getElementById('mysource');
        if (mySourceElement) {
            // 親要素を取得し、ボタンを挿入
            const parentElement = mySourceElement.parentNode;
            parentElement.insertBefore(fetchVideoButton, mySourceElement.nextSibling);
        } else {
            // Myソースが見つからない場合のエラーハンドリング
            console.error('Myソース要素が見つかりません。');
        }
    }

    // ページ読み込み完了後にメインの関数を実行
    window.addEventListener('load', main);

})();
