### Name: RpadUtil
### Title: Rpad utilities
### Aliases: RpadURL RpadBaseURL RpadBaseFile RpadIsLocal
### Keywords: math

### ** Examples

  # make some data
  x <- 1:10
  y2 <- x^3
  save(x, y2, file = RpadBaseFile("testdata.RData"))
  # output a link to the user:
  HTMLon()
  cat("<a href='", RpadBaseURL("testdata.RData"), sep="")
  cat("'>Click</a> to download the test data.")



