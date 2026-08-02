/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import { DocumentTypeDecoration } from '@graphql-typed-document-node/core';
export type UpdateProfileInput = {
  bio?: string | null | undefined;
  displayName?: string | null | undefined;
  headline?: string | null | undefined;
  location?: string | null | undefined;
  noteBody?: string | null | undefined;
  noteTitle?: string | null | undefined;
  website?: string | null | undefined;
};

export type ViewerQueryVariables = Exact<{ [key: string]: never; }>;


export type ViewerQuery = { viewer: { id: string, login: string, displayName: string | null, avatarUrl: string | null } };

export type ProfileQueryVariables = Exact<{ [key: string]: never; }>;


export type ProfileQuery = { profile: { id: string, login: string, displayName: string | null, avatarUrl: string | null, headline: string | null, bio: string | null, location: string | null, website: string | null, followers: number, following: number, stars: number, note: { title: string | null, body: string | null }, focus: Array<{ title: string, description: string }>, collaboration: Array<{ title: string, description: string }>, organizations: Array<{ id: string, slug: string, displayName: string, role: string, source: string }>, projects: Array<{ id: string, namespace: string, slug: string, displayName: string, description: string | null, visibility: string, languages: unknown, syncState: string, role: string }>, roles: Array<{ repositoryId: string, namespace: string, repository: string, role: string, source: string, description: string | null }>, activity: Array<{ id: string, kind: string, entityType: string, entityId: string, payload: unknown, occurredAt: string }>, contributionRhythm: Array<{ date: string, orkia: number, github: number }> } };

export type UpdateProfileMutationVariables = Exact<{
  input: UpdateProfileInput;
}>;


export type UpdateProfileMutation = { updateProfile: { id: string, login: string, displayName: string | null, avatarUrl: string | null, headline: string | null, bio: string | null, location: string | null, website: string | null, followers: number, following: number, stars: number, note: { title: string | null, body: string | null }, focus: Array<{ title: string, description: string }>, collaboration: Array<{ title: string, description: string }>, organizations: Array<{ id: string, slug: string, displayName: string, role: string, source: string }>, projects: Array<{ id: string, namespace: string, slug: string, displayName: string, description: string | null, visibility: string, languages: unknown, syncState: string, role: string }>, roles: Array<{ repositoryId: string, namespace: string, repository: string, role: string, source: string, description: string | null }>, activity: Array<{ id: string, kind: string, entityType: string, entityId: string, payload: unknown, occurredAt: string }>, contributionRhythm: Array<{ date: string, orkia: number, github: number }> } };

export type RepositoriesQueryVariables = Exact<{ [key: string]: never; }>;


export type RepositoriesQuery = { repositories: Array<{ id: string, namespace: string, slug: string, displayName: string, visibility: string, defaultBranch: string | null, description: string | null, readmeMarkdown: string | null, licenseSpdx: string | null, languages: unknown, counters: unknown, revision: number, syncState: string, lastSyncedAt: string | null }> };

export type InboxQueryVariables = Exact<{
  state?: string | null | undefined;
}>;


export type InboxQuery = { inbox: Array<{ id: string, threadId: string, kind: string, title: string, summary: string | null, state: string, priority: number, repositoryId: string | null, subject: unknown, createdAt: string, updatedAt: string }> };

export type FeedQueryVariables = Exact<{ [key: string]: never; }>;


export type FeedQuery = { feed: Array<{ id: string, kind: string, title: string, summary: string | null, repositoryId: string | null, payload: unknown, occurredAt: string }> };

export type PublicRepositoryQueryVariables = Exact<{
  namespace: string;
  slug: string;
}>;


export type PublicRepositoryQuery = { publicRepository: { id: string, namespace: string, slug: string, displayName: string, visibility: string, defaultBranch: string | null, description: string | null, readmeMarkdown: string | null, licenseSpdx: string | null, languages: unknown, counters: unknown, revision: number, syncState: string, lastSyncedAt: string | null } };

export type RepositoryOperationsQueryVariables = Exact<{
  id: string;
}>;


export type RepositoryOperationsQuery = { repositoryOperations: { repositoryId: string, openConflicts: number, pendingSync: number, failedSync: number, openPullRequests: number, pendingReviews: number, pendingGates: number, activePolicy: unknown, recentFailures: unknown } };

export type RepositoryChangeSetsQueryVariables = Exact<{
  repositoryId: string;
}>;


export type RepositoryChangeSetsQuery = { repositoryChangeSets: unknown };

export type SyncRepositoryMutationVariables = Exact<{
  id: string;
}>;


export type SyncRepositoryMutation = { syncRepository: boolean };

export type ImportGithubRepositoriesMutationVariables = Exact<{ [key: string]: never; }>;


export type ImportGithubRepositoriesMutation = { importGithubRepositories: Array<{ id: string, namespace: string, slug: string, displayName: string, visibility: string, defaultBranch: string | null, description: string | null, readmeMarkdown: string | null, licenseSpdx: string | null, languages: unknown, counters: unknown, revision: number, syncState: string, lastSyncedAt: string | null }> };

export type CreateIssueMutationVariables = Exact<{
  repositoryId: string;
  idempotencyKey: string;
  title: string;
  body: string;
}>;


export type CreateIssueMutation = { createIssue: { id: string, repositoryId: string, number: number | null, title: string, body: string, state: string, revision: number, syncState: string, createdAt: string, updatedAt: string } };

export type UpdateInboxMutationVariables = Exact<{
  itemId: string;
  state: string;
}>;


export type UpdateInboxMutation = { updateInbox: { id: string, threadId: string, kind: string, title: string, summary: string | null, state: string, priority: number, repositoryId: string | null, subject: unknown, createdAt: string, updatedAt: string } };

export class TypedDocumentString<TResult, TVariables>
  extends String
  implements DocumentTypeDecoration<TResult, TVariables>
{
  __apiType?: NonNullable<DocumentTypeDecoration<TResult, TVariables>['__apiType']>;
  private value: string;
  public __meta__?: Record<string, any> | undefined;

  constructor(value: string, __meta__?: Record<string, any> | undefined) {
    super(value);
    this.value = value;
    this.__meta__ = __meta__;
  }

  override toString(): string & DocumentTypeDecoration<TResult, TVariables> {
    return this.value;
  }
}

export const ViewerDocument = new TypedDocumentString(`
    query Viewer {
  viewer {
    id
    login
    displayName
    avatarUrl
  }
}
    `) as unknown as TypedDocumentString<ViewerQuery, ViewerQueryVariables>;
export const ProfileDocument = new TypedDocumentString(`
    query Profile {
  profile {
    id
    login
    displayName
    avatarUrl
    headline
    bio
    location
    website
    followers
    following
    stars
    note {
      title
      body
    }
    focus {
      title
      description
    }
    collaboration {
      title
      description
    }
    organizations {
      id
      slug
      displayName
      role
      source
    }
    projects {
      id
      namespace
      slug
      displayName
      description
      visibility
      languages
      syncState
      role
    }
    roles {
      repositoryId
      namespace
      repository
      role
      source
      description
    }
    activity {
      id
      kind
      entityType
      entityId
      payload
      occurredAt
    }
    contributionRhythm {
      date
      orkia
      github
    }
  }
}
    `) as unknown as TypedDocumentString<ProfileQuery, ProfileQueryVariables>;
export const UpdateProfileDocument = new TypedDocumentString(`
    mutation UpdateProfile($input: UpdateProfileInput!) {
  updateProfile(input: $input) {
    id
    login
    displayName
    avatarUrl
    headline
    bio
    location
    website
    followers
    following
    stars
    note {
      title
      body
    }
    focus {
      title
      description
    }
    collaboration {
      title
      description
    }
    organizations {
      id
      slug
      displayName
      role
      source
    }
    projects {
      id
      namespace
      slug
      displayName
      description
      visibility
      languages
      syncState
      role
    }
    roles {
      repositoryId
      namespace
      repository
      role
      source
      description
    }
    activity {
      id
      kind
      entityType
      entityId
      payload
      occurredAt
    }
    contributionRhythm {
      date
      orkia
      github
    }
  }
}
    `) as unknown as TypedDocumentString<UpdateProfileMutation, UpdateProfileMutationVariables>;
export const RepositoriesDocument = new TypedDocumentString(`
    query Repositories {
  repositories {
    id
    namespace
    slug
    displayName
    visibility
    defaultBranch
    description
    readmeMarkdown
    licenseSpdx
    languages
    counters
    revision
    syncState
    lastSyncedAt
  }
}
    `) as unknown as TypedDocumentString<RepositoriesQuery, RepositoriesQueryVariables>;
export const InboxDocument = new TypedDocumentString(`
    query Inbox($state: String) {
  inbox(stateFilter: $state) {
    id
    threadId
    kind
    title
    summary
    state
    priority
    repositoryId
    subject
    createdAt
    updatedAt
  }
}
    `) as unknown as TypedDocumentString<InboxQuery, InboxQueryVariables>;
export const FeedDocument = new TypedDocumentString(`
    query Feed {
  feed {
    id
    kind
    title
    summary
    repositoryId
    payload
    occurredAt
  }
}
    `) as unknown as TypedDocumentString<FeedQuery, FeedQueryVariables>;
export const PublicRepositoryDocument = new TypedDocumentString(`
    query PublicRepository($namespace: String!, $slug: String!) {
  publicRepository(namespace: $namespace, slug: $slug) {
    id
    namespace
    slug
    displayName
    visibility
    defaultBranch
    description
    readmeMarkdown
    licenseSpdx
    languages
    counters
    revision
    syncState
    lastSyncedAt
  }
}
    `) as unknown as TypedDocumentString<PublicRepositoryQuery, PublicRepositoryQueryVariables>;
export const RepositoryOperationsDocument = new TypedDocumentString(`
    query RepositoryOperations($id: UUID!) {
  repositoryOperations(id: $id) {
    repositoryId
    openConflicts
    pendingSync
    failedSync
    openPullRequests
    pendingReviews
    pendingGates
    activePolicy
    recentFailures
  }
}
    `) as unknown as TypedDocumentString<RepositoryOperationsQuery, RepositoryOperationsQueryVariables>;
export const RepositoryChangeSetsDocument = new TypedDocumentString(`
    query RepositoryChangeSets($repositoryId: UUID!) {
  repositoryChangeSets(repositoryId: $repositoryId)
}
    `) as unknown as TypedDocumentString<RepositoryChangeSetsQuery, RepositoryChangeSetsQueryVariables>;
export const SyncRepositoryDocument = new TypedDocumentString(`
    mutation SyncRepository($id: UUID!) {
  syncRepository(id: $id)
}
    `) as unknown as TypedDocumentString<SyncRepositoryMutation, SyncRepositoryMutationVariables>;
export const ImportGithubRepositoriesDocument = new TypedDocumentString(`
    mutation ImportGithubRepositories {
  importGithubRepositories {
    id
    namespace
    slug
    displayName
    visibility
    defaultBranch
    description
    readmeMarkdown
    licenseSpdx
    languages
    counters
    revision
    syncState
    lastSyncedAt
  }
}
    `) as unknown as TypedDocumentString<ImportGithubRepositoriesMutation, ImportGithubRepositoriesMutationVariables>;
export const CreateIssueDocument = new TypedDocumentString(`
    mutation CreateIssue($repositoryId: UUID!, $idempotencyKey: String!, $title: String!, $body: String!) {
  createIssue(
    repositoryId: $repositoryId
    idempotencyKey: $idempotencyKey
    input: {title: $title, body: $body}
  ) {
    id
    repositoryId
    number
    title
    body
    state
    revision
    syncState
    createdAt
    updatedAt
  }
}
    `) as unknown as TypedDocumentString<CreateIssueMutation, CreateIssueMutationVariables>;
export const UpdateInboxDocument = new TypedDocumentString(`
    mutation UpdateInbox($itemId: UUID!, $state: String!) {
  updateInbox(itemId: $itemId, stateValue: $state) {
    id
    threadId
    kind
    title
    summary
    state
    priority
    repositoryId
    subject
    createdAt
    updatedAt
  }
}
    `) as unknown as TypedDocumentString<UpdateInboxMutation, UpdateInboxMutationVariables>;