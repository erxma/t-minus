<script lang="ts">
    import "$lib/global.css";
</script>

<div>
    <a href="./subway" class="button-default" id="link-subway">Subway</a>
    <a href="./bus" class="button-default" id="link-bus">Bus</a>
    <a href="./cr" class="button-default" id="link-cr">Commuter Rail</a>
</div>

<style>
    div {
        display: flex;
        flex-direction: column;
        margin: auto;
    }

    a {
        font-size: var(--font-size-xl);
        text-align: center;
        text-decoration: none;
        margin: 12px 2em;
    }

    #link-subway {
        background-color: #494f5b;
    }

    #link-bus {
        background-color: #ffc72c;
        color: black;
    }

    #link-cr {
        background-color: #80276c;
    }
</style>
