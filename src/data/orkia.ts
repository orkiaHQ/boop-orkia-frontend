import {
  CreateIssueDocument,
  FeedDocument,
  InboxDocument,
  ImportGithubRepositoriesDocument,
  ProfileDocument,
  PublicRepositoryDocument,
  RepositoryChangeSetsDocument,
  RepositoryCanonicalChangeSetsDocument,
  RepositoriesDocument,
  RepositoryOperationsDocument,
  SyncRepositoryDocument,
  UpdateInboxDocument,
  UpdateProfileDocument,
  ViewerDocument,
  type FeedQuery,
  type InboxQuery,
  type ProfileQuery,
  type RepositoriesQuery,
  type RepositoryChangeSetsQuery,
  type RepositoryCanonicalChangeSetsQuery,
  type RepositoryOperationsQuery,
  type ViewerQuery,
  type UpdateProfileInput,
} from '../gql/graphql'
import { gql } from './client'

export type Viewer = ViewerQuery['viewer']
export type Repository = RepositoriesQuery['repositories'][number]
export type InboxItem = InboxQuery['inbox'][number]
export type FeedEntry = FeedQuery['feed'][number]
export type Profile = ProfileQuery['profile']
type GeneratedRepositoryOperations = RepositoryOperationsQuery['repositoryOperations']
export type RepositoryOperations = Omit<GeneratedRepositoryOperations, 'activePolicy' | 'recentFailures'> & {
  activePolicy?: { version: number; definition: unknown } | null
  recentFailures: unknown[]
}
export type RepositoryChangeSetDetection = RepositoryChangeSetsQuery['repositoryChangeSets']
export type RepositoryCanonicalChangeSets = RepositoryCanonicalChangeSetsQuery['repositoryCanonicalChangeSets']

export const orkiaApi = {
  me: async () => (await gql.request(ViewerDocument)).viewer,
  logout: async () => {
    const response = await fetch('/auth/logout', { method: 'POST', credentials: 'include' })
    if (!response.ok) throw new Error('Unable to sign out')
  },
  profile: async () => (await gql.request(ProfileDocument)).profile,
  updateProfile: async (input: UpdateProfileInput) =>
    (await gql.request(UpdateProfileDocument, { input })).updateProfile,
  repositories: async () => (await gql.request(RepositoriesDocument)).repositories,
  importGithubRepositories: async () =>
    (await gql.request(ImportGithubRepositoriesDocument)).importGithubRepositories,
  inbox: async (state?: string) => (await gql.request(InboxDocument, { state })).inbox,
  feed: async () => (await gql.request(FeedDocument)).feed,
  publicRepository: async (namespace: string, slug: string) =>
    (await gql.request(PublicRepositoryDocument, { namespace, slug })).publicRepository,
  operations: async (id: string) => {
    const value = (await gql.request(RepositoryOperationsDocument, { id })).repositoryOperations
    return value as RepositoryOperations
  },
  repositoryChangeSets: async (repositoryId: string) =>
    (await gql.request(RepositoryChangeSetsDocument, { repositoryId })).repositoryChangeSets,
  repositoryCanonicalChangeSets: async (repositoryId: string) =>
    (await gql.request(RepositoryCanonicalChangeSetsDocument, { repositoryId })).repositoryCanonicalChangeSets,
  syncRepository: async (id: string) => {
    await gql.request(SyncRepositoryDocument, { id })
  },
  createIssue: async (repositoryId: string, title: string, body = '') =>
    (await gql.request(CreateIssueDocument, {
      repositoryId,
      idempotencyKey: crypto.randomUUID(),
      title,
      body,
    })).createIssue,
  updateInbox: async (itemId: string, state: string) =>
    (await gql.request(UpdateInboxDocument, { itemId, state })).updateInbox,
}

export function connectOrkiaEvents(onEvent: (event: MessageEvent) => void) {
  const source = new EventSource('/api/v1/events', { withCredentials: true })
  ;['orkia.ui.sync', 'orkia.projection.sync.updated', 'orkia.projection.inbox.updated', 'orkia.projection.feed.updated']
    .forEach(type => source.addEventListener(type, onEvent))
  return () => source.close()
}
