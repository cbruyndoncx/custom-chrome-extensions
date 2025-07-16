console.log('Popup script loaded');

async function getTabGroupsAndTabs() {
  console.log('Fetching tab groups and tabs...');
  // Get all tab groups in the current window
  const tabGroups = await chrome.tabGroups.query({windowId: chrome.windows.WINDOW_ID_CURRENT});
  // Get all tabs in current window
  const tabs = await chrome.tabs.query({windowId: chrome.windows.WINDOW_ID_CURRENT});

  // Map tabs into groups by groupId
  const groupsMap = {};
  for (const group of tabGroups) {
    groupsMap[group.id] = { title: group.title || "Unnamed Group", color: group.color || "#888", tabs: [] };
  }

  // Tabs with no group will be grouped separately
  const ungrouped = { title: "Ungrouped Tabs", color: "#333", tabs: [] };

  for (const tab of tabs) {
    if (tab.groupId !== -1 && groupsMap[tab.groupId]) {
      groupsMap[tab.groupId].tabs.push(tab);
    } else {
      ungrouped.tabs.push(tab);
    }
  }

  return { groups: Object.values(groupsMap), ungrouped };
}

function render() {
  getTabGroupsAndTabs().then(({groups, ungrouped}) => {
    const container = document.getElementById("groupsContainer");
    container.innerHTML = "";

    function createGroupDiv(group) {
      const groupDiv = document.createElement("div");
      groupDiv.className = "group";
      groupDiv.style.borderColor = group.color;

      const title = document.createElement("div");
      title.className = "group-title";
      title.textContent = group.title;
      groupDiv.appendChild(title);

      group.tabs.forEach(tab => {
        const tabDiv = document.createElement("div");
        tabDiv.className = "tab";
        tabDiv.title = tab.url;
        // favicon image
        if (tab.favIconUrl) {
          const favImg = document.createElement("img");
          favImg.src = tab.favIconUrl;
          favImg.style.width = "16px";
          favImg.style.height = "16px";
          favImg.style.verticalAlign = "middle";
          favImg.style.marginRight = "6px";
          tabDiv.appendChild(favImg);
        }
        // tab title text
        const textSpan = document.createElement("span");
        textSpan.textContent = tab.title || tab.url;
        tabDiv.appendChild(textSpan);

        tabDiv.onclick = () => {
          chrome.tabs.update(tab.id, {active: true});
          chrome.windows.update(tab.windowId, {focused: true});
        };
        groupDiv.appendChild(tabDiv);
      });
      return groupDiv;
    }

    groups.forEach(group => {
      container.appendChild(createGroupDiv(group));
    });

    if (ungrouped.tabs.length > 0) {
      container.appendChild(createGroupDiv(ungrouped));
    }
  });
}

render();
