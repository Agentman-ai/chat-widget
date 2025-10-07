#!/bin/bash

# Agentman Chat Widget Release Script
# Combines version bumping, building, and committing in one command
# Usage: ./release.sh [patch|minor|major]

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if release type is provided
RELEASE_TYPE=${1:-patch}

if [[ ! "$RELEASE_TYPE" =~ ^(patch|minor|major)$ ]]; then
    print_error "Invalid release type: $RELEASE_TYPE"
    echo "Usage: ./release.sh [patch|minor|major]"
    exit 1
fi

# Check if we're on main branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
    print_warning "You are on branch '$CURRENT_BRANCH', not 'main'"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Release cancelled"
        exit 1
    fi
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    print_error "You have uncommitted changes. Please commit or stash them first."
    git status --short
    exit 1
fi

print_step "Starting $RELEASE_TYPE release process..."
echo

# Step 1: Pull latest changes from remote
print_step "Step 1/6: Pulling latest changes from origin..."
if git pull --rebase origin main; then
    print_success "Successfully pulled latest changes"
else
    print_error "Failed to pull from origin. Please resolve conflicts and try again."
    exit 1
fi
echo

# Step 2: Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
print_step "Step 2/6: Current version is $CURRENT_VERSION"
echo

# Step 3: Bump version
print_step "Step 3/6: Bumping $RELEASE_TYPE version..."
NEW_VERSION=$(npm version $RELEASE_TYPE --no-git-tag-version 2>/dev/null | sed 's/v//')
print_success "Version bumped from $CURRENT_VERSION to $NEW_VERSION"
echo

# Step 4: Build the project
print_step "Step 4/6: Building project..."
if npm run build; then
    print_success "Build completed successfully"
else
    print_error "Build failed. Reverting version bump..."
    git checkout -- package.json package-lock.json
    exit 1
fi
echo

# Step 5: Commit changes
print_step "Step 5/6: Committing changes..."
git add package.json package-lock.json dist/

# Create commit message
COMMIT_MSG="chore: release v${NEW_VERSION}

Bump version from ${CURRENT_VERSION} to ${NEW_VERSION}

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

git commit -m "$COMMIT_MSG"
print_success "Changes committed"
echo

# Step 6: Create git tag
print_step "Step 6/6: Creating git tag v${NEW_VERSION}..."
git tag -a "v${NEW_VERSION}" -m "Release v${NEW_VERSION}"
print_success "Tag v${NEW_VERSION} created"
echo

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_success "Release v${NEW_VERSION} prepared successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo
echo "Next steps:"
echo "  1. Review the changes: git show HEAD"
echo "  2. Push to remote:     git push origin main --follow-tags"
echo
echo "To undo this release (before pushing):"
echo "  git reset --hard HEAD~1"
echo "  git tag -d v${NEW_VERSION}"
echo
