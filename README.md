# USM TS

## Clone Source Code

```
git clone https://github.com/DonGambas/usm-ts.git
```

## Install Deps and Compile Typescript Packages

```
cd usm-ts

// runs npm i && tsc in each typescript package

lerna run build-ts

```

## Compile Typescript Packages

Compiles typescript pacakges, only run if you did not run the above command (`lerna run build-ts`) and instead installed node dependencies manually in each package.

```
//runs npm tsc in all packages

lerna run tsc
```

## Publish

Requires you to be a contributor to the `usm-js` and `usm-cli` project on npmjs.com

```
//starts publishing process for all public repos

lerna publish
```
