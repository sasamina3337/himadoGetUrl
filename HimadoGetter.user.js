// ==UserScript==
// @name         ひまわり動画ゲッター
// @namespace    https://github.com/sasamina3337/
// @description  ひまわり動画内に動画url取得用のボタンを表示させる
// @version      1.16
// @author       sasamina
// @match        http://himado.in/*
// @match        https://web.archive.org/*
// @grant        none
// @updateURL    https://github.com/sasamina3337/himadoGetUrl/raw/main/HimadoGetter.user.js
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
            return decodeURIComponent(encodedUrl);
        } catch (e) {
            console.error('decodeURL error:', e);
            return encodedUrl;
        }
    }

    function checkVideoAvailability(url) {
        var video = document.createElement('video');
        var canPlayMp4 = video.canPlayType('video/mp4').replace(/no/, '');
        var canPlayWebm = video.canPlayType('video/webm').replace(/no/, '');
        var extension = url.split('.').pop().split(/\#|\?/)[0];
        return (extension === 'mp4' && canPlayMp4) || (extension === 'webm' && canPlayWebm);
    }

    function buildUI(videoList, availableMovieUrl) {
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

        const modalContent = document.createElement('div');
        modalContent.style.backgroundColor = '#fff';
        modalContent.style.padding = '20px';
        modalContent.style.borderRadius = '5px';
        modalContent.style.width = '80%';
        modalContent.style.maxHeight = '80vh';
        modalContent.style.overflowY = 'auto';

        const closeButton = document.createElement('button');
        closeButton.textContent = 'X';
        closeButton.style.position = 'absolute';
        closeButton.style.top = '10px';
        closeButton.style.right = '10px';
        closeButton.addEventListener('click', function() {
            modalContainer.style.display = 'none';
        });

        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';

        videoList.forEach(function(video, index) {
            const row = document.createElement('tr');

            const domainCell = document.createElement('td');
            domainCell.textContent = `${index + 1}: ${extractDomain(video)}`;
            domainCell.style.cursor = 'pointer';
            domainCell.onclick = function() {
                copyToClipboard(video);
            };
            row.appendChild(domainCell);

            const statusCell = document.createElement('td');
            statusCell.textContent = availableMovieUrl[index] ? '再生可能' : '再生不可能';
            row.appendChild(statusCell);

            const thumbCell = document.createElement('td');
            const thumbImage = document.createElement('img');
            thumbImage.src = availableMovieUrl[index] ? decodeURL(video) : 'http://himado.in/image/himatan/noimage130.png';
            thumbImage.style.width = '80px';
            thumbImage.style.height = '60px';
            thumbImage.style.cursor = 'pointer';
            thumbImage.onclick = function() {
                window.open('https://sakudo.in/?id=' + movie_id + '&file=' + encodeURIComponent(video), '_blank');
            };
            thumbCell.appendChild(thumbImage);
            row.appendChild(thumbCell);

            table.appendChild(row);
        });

        modalContent.appendChild(closeButton);
        modalContent.appendChild(table);
        modalContainer.appendChild(modalContent);
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
        const image = document.createElement('img');
        image.src = base64Data;
        image.style.width = '100px';
        image.style.height = 'auto';
        image.alt = 'サムネイル';
        const containerElement = document.getElementById(elementId);
        if (containerElement) {
            containerElement.appendChild(image);
        } else {
            console.error('Element with id ' + elementId + ' not found.');
        }
    }

    function getVideoUrls() {
        var movieUrls = [];
        var ary_spare_sources_flash = window.ary_spare_sources_flash || {};
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
        const availableMovieUrls = videoUrls.map(url => {
            return checkVideoAvailability(url);
        });
        buildUI(videoUrls, availableMovieUrls);
    }

    function checkAndRedirect() {
        const dataBlocks = document.querySelectorAll('.datablock');
        dataBlocks.forEach(dataBlock => {
            if (dataBlock.textContent.includes('この動画は閲覧できません。')) {
                window.location.href = 'https://web.archive.org/web/0/' + window.location.href;
            }
        });
    }

    async function requestPictureInPicture(element) {
        try {
            await document.documentElement.requestPictureInPicture();
            element.width = document.pictureInPictureWindow.width;
            element.height = document.pictureInPictureWindow.height;
            document.pictureInPictureWindow.addEventListener('resize', () => {
                element.width = document.pictureInPictureWindow.width;
                element.height = document.pictureInPictureWindow.height;
            });
        } catch (error) {
            console.error('Failed to enter Picture-in-Picture mode:', error);
        }
    }

    function main() {
        const fetchVideoButton = document.createElement('button');
        fetchVideoButton.textContent = '動画取得';
        fetchVideoButton.style.marginLeft = '10px';

        document.addEventListener('DOMContentLoaded', function() {
            checkAndRedirect();
        });

        fetchVideoButton.addEventListener('click', function(event) {
            event.preventDefault();
            const videoUrls = getVideoUrls();

            if (videoUrls.length === 0) {
                window.open('https://web.archive.org/web/0/' + window.location.href, '_blank');
                return;
            }

            updateUIWithVideoAvailability(videoUrls);
            console.log('取得した動画URLのリスト:', videoUrls);
            console.log('動画取得ボタンがクリックされました。');
        });

        const mySourceElement = document.getElementById('mysource');
        if (mySourceElement) {
            const parentElement = mySourceElement.parentNode;
            parentElement.insertBefore(fetchVideoButton, mySourceElement.nextSibling);

            const pipButton = document.createElement('button');
            pipButton.textContent = 'ピクチャインピクチャ';
            pipButton.style.marginLeft = '10px';

            pipButton.addEventListener('click', async function(event) {
                event.preventDefault();  // ここでイベントのデフォルト動作を防止
                const playerElement = document.getElementById('player');
                if (playerElement) {
                    if (document.pictureInPictureEnabled) {
                        if (document.pictureInPictureElement) {
                            await document.exitPictureInPicture();
                        } else {
                            await requestPictureInPicture(playerElement);
                        }
                    } else {
                        console.error('Document Picture-in-Picture is not enabled.');
                    }
                } else {
                    console.error('Player element not found.');
                }
            });

            parentElement.insertBefore(pipButton, mySourceElement.nextSibling);
        } else {
            console.error('Myソース要素が見つかりません。');
        }
    }

    window.addEventListener('load', main);

})();
