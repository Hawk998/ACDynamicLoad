<script lang="ts">
	import {
		splitScreenActive,
		activeElement,
		navigation,
		showAppContent,
	} from "./store/store";
	import SplitScreen from "./pages/SplitScreen.svelte";
	import {
		changeActiveTab,
		handleSplitScreen,
		closeTab,
		splitScreen,
		defaultElement,
		splitScreenElements,
		splitScreenPossible,
	} from "./lib/tab";

	let isAppMaximized = false;
	let appVersion = "";

	$: $activeElement && handleSplitScreen();
	$: $splitScreenActive;
	$: $navigation;

	globalThis.api.receive("get:isAppMaximized", (resp) => {
		isAppMaximized = resp;
		showAppContent.set(true);
	});

	globalThis.api.receive("get:version", (version) => {
		appVersion = `v${version}`;
	});
	globalThis.api.send("get:isAppMaximized");
	globalThis.api.send("get:version");

	function closeApp() {
		globalThis.api.send("set:closeApp");
	}

	function minimizeApp() {
		globalThis.api.send("set:minimizeApp");
	}

	function maximizeApp() {
		globalThis.api.send("set:maximizeApp");
		globalThis.api.send("get:isAppMaximized");
	}

	function compressApp() {
		globalThis.api.send("set:compressApp");
		globalThis.api.send("get:isAppMaximized");
	}
</script>

<div class="navigationArea">
	<div class="navigation">
		{#key $activeElement}
			<ul class="nav nav-tabs">
				{#each $navigation as item}
					<li class="nav-item">
						<a
							on:click={(e) => changeActiveTab(item.title)}
							class={$activeElement === item.title
								? "nav-link active"
								: "nav-link"}
						>
							<span>
								{item.title}
							</span>

							{#if item.title != defaultElement}
								{#if splitScreenPossible && $splitScreenActive === false}
									<i
										on:click={(e) => splitScreen(item)}
										class="fas fa-columns {splitScreenElements.length ===
										0
											? 'splitBtn1'
											: 'splitBtn2'}"
									></i>
								{:else if $splitScreenActive && item.title.includes("||")}
									<i
										on:click={(e) => splitScreen(item)}
										class="fas fa-unlink unlinkBtn"
									></i>
								{/if}
								<i
									on:click={(e) => closeTab(item.title)}
									class="far fa-window-close closeBtn"
								></i>
							{/if}
						</a>
					</li>
				{/each}
			</ul>
		{/key}
	</div>
	<div class="drag dragable">
		<i class="fas fa-yin-yang"></i>
		<span>Sveltron {appVersion}</span>
	</div>
	<div class="icons">
		{#key isAppMaximized}
			<span class="windowIcons">
				<i on:click={minimizeApp} class="fas fa-window-minimize windowIcon"
				></i>
				{#if isAppMaximized}
					<i on:click={compressApp} class="fas fa-compress windowIcon"
					></i>
				{:else}
					<i
						on:click={maximizeApp}
						class="fas fa-window-maximize windowIcon"
					></i>
				{/if}
				<i on:click={closeApp} class="fas fa-times windowIcon"></i>
			</span>
		{/key}
	</div>
</div>
<div class="content">
	{#key $activeElement}
		{#each $navigation as element}
			{#if $activeElement === element.title}
				{#if element.component === SplitScreen}
					<SplitScreen
						page1={splitScreenElements[0]}
						page2={splitScreenElements[1]}
					></SplitScreen>
				{:else}
					<svelte:component
						this={element.component}
						title={element.title}
					/>
				{/if}
			{/if}
		{/each}
	{/key}
</div>
<style>
	.content {
		margin-top: 36px;
	}

	.navigationArea {
		z-index: 100;
		position: fixed;
		top: 0;
	}

	.navigation {
		width: auto;
		float: left;
		height: 30px;
		padding-top: 5px;
		padding-right: 5px;
		height: 36px;
		background-color: black;
		border-right-style: solid;
		border-right-color: whitesmoke;
		border-right-width: 0.5px;
	}

	.drag {
		background-color: black;
		width: 100%;
		display: table-cell;
		height: 30px;
		text-align: center;
		color: whitesmoke;
	}

	.drag > span {
		padding-left: 5px;
	}

	.icons {
		background-color: black;
		min-width: 80px;
		height: 30px;
		padding: 10px;
		display: table-cell;
		border-left-style: solid;
		border-left-color: whitesmoke;
		border-left-width: 0.5px;
	}

	.dragable {
		-webkit-user-select: none;
		user-select: none;
		-webkit-app-region: drag;
	}

	.nav-link {
		display: inline;
		color: whitesmoke;
		text-decoration: none;
		background-color: black;
	}

	.active {
		color: white;
	}

	.nav-link > span:hover {
		color: green;
		cursor: pointer;
	}

	.windowIcons {
		float: right;
	}

	.windowIcon {
		display: table-cell;
		padding-right: 5px;
		padding-left: 5px;
		color: whitesmoke;
	}

	.windowIcon:hover {
		color: green;
	}

	.closeBtn:hover {
		color: red;
	}

	.splitBtn1:hover {
		color: darkgoldenrod;
	}

	.splitBtn2:hover {
		color: green;
	}

	.unlinkBtn:hover {
		color: green;
	}
</style>
