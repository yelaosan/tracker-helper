// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
// ---- ---- ---- ---- ajax

const sendAjax = {
    post: async ({ data, url }) => {
        const xhr = new XMLHttpRequest;
        xhr.responseType = 'json';
        xhr.open('POST', url);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.send(data);

        const response = await new Promise((res, rej) => {
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    res(xhr.response);
                    return;
                }
            };
        });

        return response;
    },
    get: async ({ data, url }) => {
        const queryString = Object.keys(data).map(key => `${key}=${data[key]}`).join('&');

        const xhr = new XMLHttpRequest;
        xhr.responseType = 'json';
        xhr.open('GET', `${url}?${queryString}`);
        xhr.send(null);

        const response = await new Promise((res, rej) => {
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    res(xhr.response);
                    return;
                }
            };
        });

        return response;
    }
};

// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
// ---- ---- ---- ---- channel

// 与当前页面的DevTool Page之间建立一个channel
const channel = chrome.runtime.connect(null, {
    name: chrome.devtools.inspectedWindow.tabId.toString(),
});

function dealPostData(data) {
    const { events } = JSON.parse(data);
    
    return events.map(event => {
        return event.info;
    })
}

function renderTpl(list) {
    return list.filter(item => item.operation)
        .map(item => {
		const {
			operation,
			page_type,
			target_type,
			page_section,
            data,
            usage_id
        } = item;

        if(data && data.hipo_type && data.hipo_type === 'action_cdn_request') {
            const { url } = JSON.parse(data.json_str);
            if(/.*cf\.shopee\..+\/file\/$/.test(url)) {
                console.log('图片链接异常！');
            }
        }

		return `<table class="table table-bordered table-condensed ${(page_type === 'game_hipo_track' && usage_id === 1) ? '' : 'table-report'}">
		<thead>
			<tr class="success">
				${page_type ? `<th>Page Type</th>` : ''}
				<th>Operation</th>
				${target_type ? `<th>Target Type</th>` : ''}
				${page_section ? `<th>Page Section</th>` : ''}
				${data ? `<th>Data</th>` : ''}
			</tr>
		</thead>
		<tbody>
			<tr>
				${page_type ? `<td>${page_type}</td>` : ''}
				<td>${operation}</td>
				${target_type ? `<td>${target_type}</td>` : ''}
				${page_section ? `<td>${page_section}</td>` : ''}
				${data ? `<td><pre>${JSON.stringify(data, null, 2)}</pre></td>` : ''}
			</tr>
		</tbody>
		</table>`
	}).join('');
}

// 监听channel消息
channel.onMessage.addListener(result => {
    const { isSuccess, data, message } = result;
    if (!isSuccess) {
        document.querySelector('#error').innerHTML += message;
        return;
    }

    const { method, url, postData } = data;

    if(!/shopeemobile.com\/.*\/tr/.test(url) || method === 'OPTIONS') return;

    document.querySelector('#result').innerHTML += renderTpl(dealPostData(postData.text));
});

// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
// ---- ---- ---- ---- Panel页面中的事件

document.querySelector('#button1').addEventListener('click', (e) => {
	document.querySelector('#button1').classList.toggle('active');

	if(document.querySelector('#button1').classList.contains('active')) {
		document.styleSheets[0].addRule('.table-report', 'display: none;');
	}else {
		document.styleSheets[0].addRule('.table-report', 'display: block;');
	}
});

// 点击按钮，模拟发起ajax请求
document.querySelector('#button2').addEventListener('click', async () => {
    document.querySelector('#result').innerHTML = '';
});

// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
