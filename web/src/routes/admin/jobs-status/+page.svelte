<script lang="ts">
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import QueueCard from '$lib/components/QueueCard.svelte';
  import { AppRoute } from '$lib/constants';
  import JobCreateModal from '$lib/modals/JobCreateModal.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { getQueues, QueueCommand, runQueueCommandLegacy, type QueueResponseDto } from '@immich/sdk';
  import { Button, HStack, modalManager, Text } from '@immich/ui';
  import { mdiCog, mdiPlay, mdiPlus } from '@mdi/js';
  import { onDestroy } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  type Props = {
    data: PageData;
  };

  let { data }: Props = $props();

  let queues = $state<QueueResponseDto[]>([]);

  const pausedJobs = $derived(queues.filter(({ isPaused }) => isPaused).map(({ name }) => name));

  const refreshAll = async () => {
    try {
      queues = await getQueues();
    } catch (error) {
      handleError(error, $t('errors.something_went_wrong'));
    }
  };

  let interval = setInterval(() => void refreshAll(), 5000);
  void refreshAll();

  onDestroy(() => {
    clearInterval(interval);
  });

  const handleResumePausedJobs = async () => {
    try {
      for (const name of pausedJobs) {
        await runQueueCommandLegacy({ name, queueCommandDto: { command: QueueCommand.Resume, force: false } });
      }
      // Refresh jobs status immediately after resuming
      await refreshAll();
    } catch (error) {
      handleError(error, $t('admin.failed_job_command', { values: { command: 'resume', job: 'paused jobs' } }));
    }
  };

  const onQueueUpdate = (update: QueueResponseDto) => {
    queues = queues.map((queue) => {
      if (queue.name === update.name) {
        return update;
      }
      return queue;
    });
  };
</script>

<OnEvents {onQueueUpdate} />

<AdminPageLayout title={data.meta.title}>
  {#snippet buttons()}
    <HStack gap={0}>
      {#if pausedJobs.length > 0}
        <Button
          leadingIcon={mdiPlay}
          onclick={handleResumePausedJobs}
          size="small"
          variant="ghost"
          title={pausedJobs.join(', ')}
        >
          <Text class="hidden md:block">
            {$t('resume_paused_jobs', { values: { count: pausedJobs.length } })}
          </Text>
        </Button>
      {/if}
      <Button
        leadingIcon={mdiPlus}
        onclick={() => modalManager.show(JobCreateModal, {})}
        size="small"
        variant="ghost"
        color="secondary"
      >
        <Text class="hidden md:block">{$t('admin.create_job')}</Text>
      </Button>
      <Button
        leadingIcon={mdiCog}
        href="{AppRoute.ADMIN_SETTINGS}?isOpen=job"
        size="small"
        variant="ghost"
        color="secondary"
      >
        <Text class="hidden md:block">{$t('admin.manage_concurrency')}</Text>
      </Button>
    </HStack>
  {/snippet}

  <div class="flex flex-col gap-4 max-w-[800px] mx-auto mt-8">
    {#each queues as queue (queue.name)}
      <div class="w-full max-w-[800px]">
        <QueueCard {queue} />
      </div>
    {/each}
  </div>
  <!-- <section id="setting-content" class="flex place-content-center sm:mx-4">
    <section class="w-full pb-28 sm:w-5/6 md:w-212.5">
      {#if jobs}
        <JobsPanel {jobs} />
      {/if}
    </section>
  </section> -->
</AdminPageLayout>
