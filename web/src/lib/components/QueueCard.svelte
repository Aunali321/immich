<script lang="ts">
  import ActionButton from '$lib/components/ActionButton.svelte';
  import { asQueueItem, getQueueActions } from '$lib/services/queue.service';
  import { locale } from '$lib/stores/preferences.store';
  import type { QueueResponseDto } from '@immich/sdk';
  import { Card, CardBody, CardHeader, CardTitle, Icon, Text } from '@immich/ui';
  import { t } from 'svelte-i18n';

  type Props = {
    queue: QueueResponseDto;
  };

  const { queue }: Props = $props();

  const item = $derived(asQueueItem($t, queue));
  const { Pause, Resume, ContextMenu } = $derived(getQueueActions($t, queue));

  const commonClasses = 'flex place-items-center justify-between w-full py-1 sm:py-2 px-2';
</script>

<Card color="secondary">
  <CardHeader>
    <div class="flex justify-between">
      <CardTitle class="flex gap-1 items-center text-primary">
        <Icon icon={item.icon} />
        {item.title}
      </CardTitle>
      <div class="flex gap-1">
        <ActionButton action={Pause} />
        <ActionButton action={Resume} />
        <ActionButton action={ContextMenu} />
      </div>
    </div>
    {#if item.subtitle}
      <Text size="small" class="mt-2">{item.subtitle}</Text>
    {/if}
  </CardHeader>

  <CardBody>
    <div class="flex w-full max-w-md flex-col sm:flex-row rounded-lg overflow-hidden">
      <div class="{commonClasses} bg-primary text-light">
        <p>{$t('active')}</p>
        <Text size="large">{queue.statistics.active.toLocaleString($locale)}</Text>
      </div>

      <div
        class="{commonClasses} flex-row-reverse bg-gray-200 text-immich-dark-bg dark:bg-gray-700 dark:text-immich-gray"
      >
        <Text size="large">{queue.statistics.waiting.toLocaleString($locale)}</Text>
        <p>{$t('waiting')}</p>
      </div>
    </div>
  </CardBody>
</Card>
