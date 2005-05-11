# includes modifications from ftable.R 

pivtable <- function(...) {
  x = ftable(...)
  class(x) <- c("pivtable",class(x))
  x
}

print.pivtable <- function(x, file = "", quote = FALSE,
                         digits = getOption("digits"))
{
    if(!inherits(x, "ftable"))
        stop(paste("x must be an", sQuote("ftable")))
    ox <- x
    charQuote <- function(s)
        if(quote) paste("\"", s, "\"", sep = "") else s
    makeLabels <- function(lst) {
        lens <- sapply(lst, length)
        cplensU <- c(1, cumprod(lens))
        cplensD <- rev(c(1, cumprod(rev(lens))))
        y <- NULL
        for (i in rev(seq(along = lst))) {
            ind <- 1 + seq(from = 0, to = lens[i] - 1) * cplensD[i + 1]
            tmp <- character(length = cplensD[i])
            tmp[ind] <- charQuote(lst[[i]])
            y <- cbind(rep(c(tmp,"Sum"), times = cplensU[i]), y)
        }
        y
    }
    makeNames <- function(x) {
        nmx <- names(x)
        if(is.null(nmx))
            nmx <- rep("", length.out = length(x))
        nmx
    }

    xrv <- attr(x, "row.vars")
    xcv <- attr(x, "col.vars")
    LABS <- cbind(rbind(matrix("", nr = length(xcv), nc = length(xrv)),
                        charQuote(makeNames(xrv)),
                        makeLabels(xrv)),
                  c(charQuote(makeNames(xcv)),
                    rep("", times = nrow(x) + 1)))
    DATA <- rbind(if(length(xcv)) t(makeLabels(xcv)),
                  rep("", times = ncol(x)),
                  format(unclass(x), digits = digits))
    DATA[grep("NA",DATA)] <- ""
    x <- cbind(apply(LABS, 2, format, justify = "left"),
               apply(DATA, 2, format, justify = "right"))
    cat(t(x), file = file, sep = c(rep(" ", ncol(x) - 1), "\n"))
    invisible(ox)
}

broken.print.pivtable <- function(x, file = "", quote = FALSE,
                         digits = getOption("digits"))
{
    if(!inherits(x, "ftable"))
        stop(paste("x must be an", sQuote("ftable")))

    lens <- sapply(lst, length)
    ox <- x
    xrv <- attr(x, "row.vars")
    xcv <- attr(x, "col.vars")
    nrv <- sapply(xrv, length)
    ncv <- sapply(xcv, length)
    nComb = function(x) {
      if (length(x) == 1) { 1 }
      else { prod(x[1:(NROW(x)-1)]) + nComb(x[1:(NROW(x)-1)]) }
    }
    nrow <- nComb(xrv) + length(xcv)
    ncol <- nComb(xcv) + length(xrv)
    result <- matrix("", nrow=nrow, ncol=ncol)
    for (i in seq(along = xrv)) {
      for (j in seq(along = xcv)) {
        jj <- jj + 1
        result[ii,jj] <- x[]
      }
      ii <- ii + 1
    }
    invisible(ox)
}
