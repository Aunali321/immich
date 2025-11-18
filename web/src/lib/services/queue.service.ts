import { eventManager } from '$lib/managers/event-manager.svelte';
import type { ActionItem } from '$lib/types';
import {
  emptyQueue,
  getQueue,
  JobCommand,
  JobName,
  QueueName,
  sendJobCommand,
  updateQueue,
  type QueueResponseDto,
} from '@immich/sdk';
import { MenuItemType, menuManager, type IconLike } from '@immich/ui';
import {
  mdiAlertCircle,
  mdiAllInclusive,
  mdiClose,
  mdiContentDuplicate,
  mdiDatabaseOutline,
  mdiDotsVertical,
  mdiEyeOutline,
  mdiFaceRecognition,
  mdiFileJpgBox,
  mdiFileXmlBox,
  mdiFolderMove,
  mdiImageSearch,
  mdiLibraryShelves,
  mdiOcr,
  mdiPause,
  mdiPlay,
  mdiSelectSearch,
  mdiTable,
  mdiTagFaces,
  mdiTrayFull,
  mdiVideo,
} from '@mdi/js';
import type { MessageFormatter } from 'svelte-i18n';

type QueueItem = {
  icon: IconLike;
  title: string;
  readonly?: boolean;
  subtitle?: string;
  jobs: ActionItem[];
};

export const getQueueActions = ($t: MessageFormatter, queue: QueueResponseDto) => {
  const View: ActionItem = {
    icon: mdiEyeOutline,
    title: $t('view'),
    onSelect: () => void handlePauseQueue(queue),
  };

  const Pause: ActionItem = {
    icon: mdiPause,
    title: $t('pause'),
    $if: () => !queue.isPaused,
    onSelect: () => void handlePauseQueue(queue),
  };

  const Resume: ActionItem = {
    icon: mdiPlay,
    title: $t('resume'),
    $if: () => queue.isPaused,
    onSelect: () => void handleResumeQueue(queue),
  };

  const Empty: ActionItem = {
    icon: mdiClose,
    title: $t('clear'),
    // $if: () => queue.statistics.waiting > 0,
    onSelect: () => void handleEmptyQueue(queue),
  };

  const EmptyFailures: ActionItem = {
    icon: mdiClose,
    color: 'danger',
    title: 'Remove failures',
    // $if: () => queue.statistics.waiting > 0,
    onSelect: () => void handleEmptyQueue(queue),
  };

  const ViewFailedJobs: ActionItem = {
    icon: mdiAlertCircle,
    title: 'View failed jobs', //$t('clear'),
    // $if: () => queue.statistics.waiting > 0,
    onSelect: () => void handleEmptyQueue(queue),
  };

  const item = asQueueItem($t, queue);

  const ContextMenu: ActionItem = {
    icon: mdiDotsVertical,
    title: $t('actions'),
    onSelect: ({ event }) =>
      void menuManager.show({
        target: event.currentTarget as HTMLElement,
        position: 'top-right',
        items: [View, Resume, Pause, ...item.jobs, ViewFailedJobs, MenuItemType.Divider, Empty, EmptyFailures],
      }),
  };

  return { View, Pause, Resume, Empty, ContextMenu };
};

export const handlePauseQueue = async (queue: QueueResponseDto) => {
  const response = await updateQueue({ name: queue.name, queueUpdateDto: { isPaused: true } });
  eventManager.emit('QueueUpdate', response);
};

export const handleResumeQueue = async (queue: QueueResponseDto) => {
  const response = await updateQueue({ name: queue.name, queueUpdateDto: { isPaused: false } });
  eventManager.emit('QueueUpdate', response);
};

export const handleEmptyQueue = async (queue: QueueResponseDto) => {
  await emptyQueue({ name: queue.name });
  const response = await getQueue({ name: queue.name });
  eventManager.emit('QueueUpdate', response);
};

export const asQueueItem = ($t: MessageFormatter, queue: QueueResponseDto): QueueItem => {
  // title: $t('admin.background_task_job'),
  // title: $t('search'),
  // title: $t('notifications'),
  // title: $t('admin.backup_database'),

  const All: ActionItem = {
    icon: mdiAllInclusive,
    title: 'Generate for all assets',
    onSelect: () =>
      sendJobCommand({
        id: queue.name as unknown as JobName,
        jobCommandDto: {
          command: JobCommand.Start,
          force: true,
        },
      }),
  };

  const Missing: ActionItem = {
    icon: mdiSelectSearch,
    title: 'Generate for missing assets',
    onSelect: () =>
      sendJobCommand({
        id: queue.name as unknown as JobName,
        jobCommandDto: {
          command: JobCommand.Start,
          force: false,
        },
      }),
  };

  const items: Record<QueueName, QueueItem> = {
    [QueueName.ThumbnailGeneration]: {
      icon: mdiFileJpgBox,
      title: $t('admin.thumbnail_generation_job'),
      subtitle: $t('admin.thumbnail_generation_job_description'),
      jobs: [All, Missing],
    },
    [QueueName.MetadataExtraction]: {
      icon: mdiTable,
      title: $t('admin.metadata_extraction_job'),
      subtitle: $t('admin.metadata_extraction_job_description'),
      jobs: [All, Missing],
    },
    [QueueName.Library]: {
      icon: mdiLibraryShelves,
      title: $t('external_libraries'),
      jobs: [All, Missing],
    },
    [QueueName.Sidecar]: {
      title: $t('admin.sidecar_job'),
      icon: mdiFileXmlBox,
      subtitle: $t('admin.sidecar_job_description'),
      jobs: [All, Missing],
    },
    [QueueName.SmartSearch]: {
      icon: mdiImageSearch,
      title: $t('admin.machine_learning_smart_search'),
      subtitle: $t('admin.smart_search_job_description'),
      jobs: [All, Missing],
    },
    [QueueName.DuplicateDetection]: {
      icon: mdiContentDuplicate,
      title: $t('admin.machine_learning_duplicate_detection'),
      subtitle: $t('admin.duplicate_detection_job_description'),
      jobs: [All, Missing],
    },
    [QueueName.FaceDetection]: {
      icon: mdiFaceRecognition,
      title: $t('admin.face_detection'),
      subtitle: $t('admin.face_detection_description'),
      jobs: [All, Missing],
    },
    [QueueName.FacialRecognition]: {
      icon: mdiTagFaces,
      title: $t('admin.machine_learning_facial_recognition'),
      subtitle: $t('admin.facial_recognition_job_description'),
      jobs: [All, Missing],
    },
    [QueueName.Ocr]: {
      icon: mdiOcr,
      title: $t('admin.machine_learning_ocr'),
      subtitle: $t('admin.ocr_job_description'),
      jobs: [All, Missing],
    },
    [QueueName.VideoConversion]: {
      icon: mdiVideo,
      title: $t('admin.video_conversion_job'),
      subtitle: $t('admin.video_conversion_job_description'),
      jobs: [All, Missing],
    },
    [QueueName.StorageTemplateMigration]: {
      icon: mdiFolderMove,
      title: $t('admin.storage_template_migration'),
      jobs: [All, Missing],
    },
    [QueueName.Migration]: {
      icon: mdiFolderMove,
      title: $t('admin.migration_job'),
      subtitle: $t('admin.migration_job_description'),
      jobs: [All, Missing],
    },
    [QueueName.BackgroundTask]: {
      icon: mdiTrayFull,
      title: $t('admin.background_task_job'),
      readonly: true,
      jobs: [All, Missing],
    },
    [QueueName.Search]: {
      icon: '',
      title: 'No jobs use this queue',
      readonly: true,
      jobs: [All, Missing],
    },
    [QueueName.Notifications]: {
      icon: '',
      title: '',
      readonly: true,
      jobs: [All, Missing],
    },
    [QueueName.BackupDatabase]: {
      icon: mdiDatabaseOutline,
      title: '',
      readonly: true,
      jobs: [All, Missing],
    },
  };

  return items[queue.name];
};
