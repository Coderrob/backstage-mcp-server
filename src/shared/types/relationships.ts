/**
 * Copyright (C) 2025 Robert Lindley
 *
 * This file is part of the project and is licensed under the GNU General Public License v3.0.
 * You may redistribute it and/or modify it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * Types and interfaces for defining and managing
 * well-known relationships between entities.
 */
enum Relationship {
  OWNED_BY = 'ownedBy',
  OWNER_OF = 'ownerOf',
  PROVIDES_API = 'providesApi',
  API_PROVIDED_BY = 'apiProvidedBy',
  CONSUMES_API = 'consumesApi',
  API_CONSUMED_BY = 'apiConsumedBy',
  DEPENDENCY_OF = 'dependencyOf',
  DEPENDS_ON = 'dependsOn',
  CHILD_OF = 'childOf',
  PARENT_OF = 'parentOf',
  HAS_MEMBER = 'hasMember',
  MEMBER_OF = 'memberOf',
  PART_OF = 'partOf',
  HAS_PART = 'hasPart',
}

/**
 * Mapping of relationships to their reverse counterparts.
 */
const relationshipMapping: Record<Relationship, Relationship> = {
  [Relationship.OWNER_OF]: Relationship.OWNED_BY,
  [Relationship.OWNED_BY]: Relationship.OWNER_OF,

  [Relationship.PROVIDES_API]: Relationship.API_PROVIDED_BY,
  [Relationship.API_PROVIDED_BY]: Relationship.PROVIDES_API,

  [Relationship.CONSUMES_API]: Relationship.API_CONSUMED_BY,
  [Relationship.API_CONSUMED_BY]: Relationship.CONSUMES_API,

  [Relationship.DEPENDENCY_OF]: Relationship.DEPENDS_ON,
  [Relationship.DEPENDS_ON]: Relationship.DEPENDENCY_OF,

  [Relationship.CHILD_OF]: Relationship.PARENT_OF,
  [Relationship.PARENT_OF]: Relationship.CHILD_OF,

  [Relationship.MEMBER_OF]: Relationship.HAS_MEMBER,
  [Relationship.HAS_MEMBER]: Relationship.MEMBER_OF,

  [Relationship.PART_OF]: Relationship.HAS_PART,
  [Relationship.HAS_PART]: Relationship.PART_OF,
};

/**
 * Get the reverse of a given relationship.
 * @param relation - The relationship to reverse
 * @returns The reverse relationship; if none exists, returns the same relationship
 */
export function getReverseRelationship(relation: Relationship): Relationship {
  return relationshipMapping[relation] ?? relation; // Defaults to the same relationship if not found
}
