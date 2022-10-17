# 🧑‍⚕️ NUPKG Doctor

Are you struggling with this error when deploying to the GitHub NuGet registry?
```
WARNING: No destination repository detected. Ensure the source project has a 'RepositoryUrl' property defined. If you're using a nuspec file, ensure that it has a repository element with the required 'type' and 'url' attributes.
```
Simply add NUPKG Doctor to your GitHub action and be assured that your package will be properly deployed.

> **Note**
> This action is supposed to be used after you have already ran your build and `nuget pack` step.

## Configuration

- **directory**: The path of your .NET project
- **repository**: To which repository this package should be linked. The repository needs to exist and should be owned by you.
- **token**: A GitHub personal access token to push to the registry. This needs to be from the account you used for the repository.
- **push**: If set to `true` the action will push to the GitHub action, if set to `false` it will only generate the .nupkg file. (Default: `true`)
- **skipduplicate**: If set to `true` the `nuget push` command will be run with the  `-SkipDuplicate` flag, if set to `false` that flag will be omitted. (Default: true)
- **version**: Include a SEMVER Version if you want to overwrite the Version

## Example Configuration

```YAML
    - name: Fix nupkg and push to GitHub registry
      uses: m-radmacher/nupkg-doctor@v1.2.0
      timeout-minutes: 2
      with:
        directory: HetkampToolbox
        repository: ${{ github.repository }}
        token: ${{ secrets.GITHUB_TOKEN }}
```
