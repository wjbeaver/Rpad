## Enter R commands that you want to execute
## upon loading of all Rpad pages in this
## directory.
##
## This loads after R has started and after
## all of the default packages have loaded,
## including the Rpad package.


## Uncomment the following to switch the
## default graphics from the ghostscript-based
## png generation to R's builtin png device.

# graphoptions(type="Rpng")


## Uncomment the following line to switch the
## Rpad directory. This is needed on
## several platforms where Rpad (the R part)
## cannot figure out it's own path names
## correctly. Change the root
## directory appropriately.
## With apache and apache2 (and IIS), you shouldn't
## need this, but with other servers, you might.

# assign("RpadDir", envir = Rpad:::.RpadEnv,
#        gsub("c:/Inetpub/wwwroot","", getwd(), ignore.case = TRUE) )


