<script lang="ts">
  type Props = {
    productName: string
    subtitle: string
    buildLabel: string
  }

  let { productName, subtitle, buildLabel }: Props = $props()
</script>

<section class="title-screen" aria-labelledby="title-heading">
  <div class="title-stage">
    <p class="title-kicker">{buildLabel}</p>
    <h1 id="title-heading">{productName}</h1>
    <p class="title-subtitle">{subtitle}</p>
    <button class="title-start" type="button" aria-label="Start is not available yet">
      Start
    </button>
  </div>
</section>
