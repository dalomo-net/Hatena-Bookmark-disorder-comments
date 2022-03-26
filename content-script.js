function buildStarApiUrl(obj, eid) {
    return 'https://s.hatena.com/entry.json?uri=https://b.hatena.ne.jp/' +
        obj.user + '/' + obj.timestamp.replaceAll('/', '').substring(0, 8) +
        '%23bookmark-' + eid
}

function getEntryUrl() {
    let htmldoc = document.getElementsByTagName("html")

    try {
        let bookmarkcount = htmldoc[0].dataset.bookmarkCount
        let pagescope = htmldoc[0].dataset.pageScope

        if (parseInt(bookmarkcount) > 1000) { throw new Error('件数多すぎ') }
        if (pagescope !== 'Entry') { throw new Error('エントリページじゃないよ') }

        let entryurl = htmldoc[0].dataset.entryUrl
        let apiurl = "https://b.hatena.ne.jp/entry/json/" + entryurl

        return apiurl

    } catch (error) {
        console.log(error)
    }
}

function multiplier(color) {
    if (color == "green") {
        return 2
    } else if (color == "red") {
        return 3
    } else if (color == "blue") {
        return 4
    } else if (color == "purple") {
        return 5
    }
}

function getStarCount(obj) {
    let starcount = 0

    if ("colored_stars" in obj.entries[0]) {
        if ("count" in obj.entries[0].colored_stars[0].stars[0]) {
            for (let i = 0; i < obj.entries[0].colored_stars.length; i++) {
                let color = obj.entries[0].colored_stars[i].color
                starcount += obj.entries[0].colored_stars[i].stars.length * multiplier(color)
            }
        } else {
            let names = []
            for (let i = 0; i < obj.entries[0].colored_stars.length; i++) {
                let color = obj.entries[0].colored_stars[i].color
                let len = obj.entries[0].colored_stars[i].stars.length
                for (let j = 0; j < len; j++) {
                    names.push(obj.entries[0].colored_stars[i].stars[j].name)
                }
                let uniquenames = Array.from(new Set(names))
                starcount += uniquenames.length * multiplier(color)
            }
        }
    }

    if ("count" in obj.entries[0].stars) {
        starcount += obj.entries[0].stars.length
    } else {
        let names = []
        for (let i = 0; i < obj.entries[0].stars.length; i++) {
            names.push(obj.entries[0].stars[i].name)
        }
        let uniquenames = Array.from(new Set(names))
        starcount += uniquenames.length
    }

    return starcount
}

async function addStarCount(data) {

    let tab = document.getElementById("disorder-comments")
    let tabname = tab.innerText

    let count = data.bookmarks.length

    for (b of data.bookmarks) {
        let starurl = buildStarApiUrl(b, data.eid)
        let star = await fetch(starurl).then(res => res.json())

        if (star.entries.length > 0) {
            b.starcount = getStarCount(star)
        } else {
            b.starcount = 0
        }

        if ((data.bookmarks.indexOf(b) % 10) == 0) {
            tab.innerText = parseInt((data.bookmarks.indexOf(b) / count) * 100) + '%'
        }
    }

    tab.innerText = tabname
    return data
}

function compareFunction(a, b, isasc) {
    if (b.starcount > a.starcount) {
        return 1
    } else if (b.starcount < a.starcount) {
        return -1
    }

    if (isasc) {
        if (new Date(b.timestamp) < new Date(a.timestamp)) {
            return 1
        } else if (new Date(b.timestamp) > new Date(a.timestamp)) {
            return -1
        }
    } else {
        if (new Date(b.timestamp) > new Date(a.timestamp)) {
            return 1
        } else if (new Date(b.timestamp) < new Date(a.timestamp)) {
            return -1
        }
    }
}

async function formatData(data) {
    let isasc = await readLocalStorage('timeasc')

    data.bookmarks.sort((a, b) => compareFunction(a, b, isasc[0]))
    return data.bookmarks.filter((item) => item.comment !== "")
}

const readLocalStorage = async (key) => {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get([key], function (result) {
            if (result[key] === undefined) {
                reject();
            } else {
                resolve(result[key]);
            }
        });
    });
};

async function addNewTab() {
    let tab = document.getElementsByClassName('entry-comment-tab')
    let li = document.createElement('li')
    li.classList.add('js-bookmarks-sort-tab')
    li.dataset.sort = "disorder"
    li.id = "disorder-comments"
    li.innerText = await readLocalStorage('tabname')
    tab[0].appendChild(li)

}

function addNewPanel() {
    let div = document.createElement('div')
    div.classList.add('bookmarks-sort-panel')
    div.classList.add('js-bookmarks-sort-panel')
    div.dataset.sort = "disorder"

    let panels = document.getElementsByClassName('bookmarks-sort-panels')
    panels[0].appendChild(div)

}

function changeTabState() {
    let tab = document.getElementsByClassName('js-bookmarks-sort-tab')
    tab[0].classList.remove('is-active')
    tab[1].classList.remove('is-active')
    tab[2].classList.add('is-active')

    let panel = document.getElementsByClassName('bookmarks-sort-panel')
    panel[0].classList.remove('is-active')
    panel[1].classList.remove('is-active')
    panel[2].classList.add('is-active')

}

function createStarPart(num) {
    let res = ""
    if (num == 0) {
        return res
    } else if (num < 15) {
        for (let i = 0; i < num; i++) {
            res += `<a class="hatena-star-star yellow"><span>yellow</span></a>`
        }
        return res
    } else {
        return `<a class="hatena-star-star yellow"><span>yellow</span></a><span class="hatena-star-inner-count yellow" tabindex="0">${num}</span><a class="hatena-star-star yellow"><span>yellow</span></a>`
    }
}

function buildEntryCommentTimestamp(a, key) {
    return `https://b.hatena.ne.jp/${a.user}/${a.timestamp.replaceAll('/', '').slice(0, 8)}#bookmark-${key}`
}

function buildEntryCommentPermalink(a, key) {
    return `/entry/${key}/comment/${a.user}`
}

function createCommentList(arr, eid) {
    let bdiv = document.createElement('div')
    bdiv.classList.add('js-bookmarks')

    for (let a of arr[0]) {
        let pardiv = document.createElement('div')
        pardiv.classList.add('entry-comment-contents')
        pardiv.classList.add('js-ignorable-user-content')
        pardiv.classList.add('js-bookmark-item')
        pardiv.classList.add('js-user-bookmark-comment')
        pardiv.classList.add('js-star-sweeped')
        pardiv.classList.add('is-short-url-clicks-loaded')
        pardiv.dataset.userName = a.user

        let starpart = createStarPart(a.starcount)
        let timeurl = buildEntryCommentTimestamp(a, eid)
        let perma = buildEntryCommentPermalink(a, eid)

        pardiv.innerHTML = `
        <div class="entry-comment-contents-main">
    <a href="/${a.user}/" class="entry-user-icon" data-gtm-label="entry-recent-icon"><img
            src="https://cdn.profile-image.st-hatena.com/users/${a.user}/profile.png" alt="${a.user}"
            title="${a.user}"></a>
    <span class="entry-comment-username"><a href="/${a.user}/"
            data-gtm-label="entry-recent-username">${a.user}</a></span>
    <span
        class="entry-comment-text js-bookmark-comment">${a.comment}</span>
    <ul class="entry-comment-tags">
    </ul>
</div>
<div class="entry-comment-contents-foot">
    <p class="entry-comment-meta">
        <span class="entry-comment-timestamp"><a class="js-bookmark-anchor-path" data-gtm-label="entry-recent-timestamp"
                href="${timeurl}">${a.timestamp}</a></span>
        <span class="entry-comment-permalink">
            <a data-gtm-label="entry-recent-permalink" href="${perma}"
                rel="">リンク</a>
        </span>
        <span class="list-star-container js-list-star-container">${starpart}</span>
        <span class="twitter-click js-short-url-clicks"></span>
    </p>
    <div class="entry-comment-menus">
        <div class="js-add-star-container add-star-container hatena-star-btn-container js-hatena-star-btn-container">
            <button class="hatena-star-btn" aria-label="Add Star">Add Star</button>
        </div>
        <div class="ui-contextMenu entry-comment-menu-more js-bookmark-menu-button is-enabled" onclick="">
            <div class="ui-contextMenu-btn entry-comment-menu-more-btn" tabindex="0" role="button"><span>その他</span>
            </div>
            <div class="ui-contextMenu-list entry-comment-menu-more-list">
                <ul tabindex="-1">
                    <li>
                        <button type="button"
                            class="ui-contextMenu-listItem entry-comment-followuser js-entry-comment-followuser">お気に入りに追加</button>
                        <button type="button"
                            class="ui-contextMenu-listItem entry-comment-unfollowuser js-entry-comment-unfollowuser is-hidden">お気に入りを解除</button>
                    </li>
                    <li>
                        <button type="button"
                            class="ui-contextMenu-listItem entry-comment-ignoreuser js-entry-comment-ignoreuser">ユーザーを非表示</button>
                        <button type="button"
                            class="ui-contextMenu-listItem entry-comment-unignoreuser js-entry-comment-unignoreuser is-hidden"
                            data-unignore-msg-hover="ユーザーを表示" data-unignore-msg="非表示に設定済み"><span
                                class="is-hidden">ユーザーを表示</span></button>
                    </li>
                    <li><button type="button"
                            class="ui-contextMenu-listItem entry-comment-reportViolation js-bookmark-report-violation-button">通報する</button>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</div>
        `

        bdiv.appendChild(pardiv)
    }

    return bdiv
}

function displayBookmarks() {
    let htmldoc = document.getElementsByTagName("html")
    let key = htmldoc[0].dataset.entryEid
    chrome.storage.local.get([key], (res) => {
        let ellist = createCommentList(res[key], key)

        let panel = document.getElementsByClassName('bookmarks-sort-panel')
        panel[2].appendChild(ellist)
    })
}

async function main() {

    await addNewTab()
    addNewPanel()

    let url = getEntryUrl()

    let data = await fetch(url).then(res => res.json())
    let addeddata = await addStarCount(data)
    let newdata = await formatData(addeddata)

    chrome.storage.local.set({ [addeddata.eid]: [newdata] })

    document.getElementById('disorder-comments').addEventListener('click', (e) => {
        if (!e.target.classList.contains('is-active')) {
            changeTabState()
            if (!e.target.classList.contains('is-expand')) {
                displayBookmarks()
                e.target.classList.add('is-expand')
            }
        }
    })

}


main()
